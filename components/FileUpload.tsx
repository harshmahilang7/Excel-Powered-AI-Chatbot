"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  sessionId: string;
  onUploadSuccess: (data: {
    fileName: string;
    totalRows: number;
    headers: string[];
    warning?: string;
  }) => void;
  onUploadError: (error: string) => void;
  isUploaded: boolean;
}

export default function FileUpload({
  sessionId,
  onUploadSuccess,
  onUploadError,
  isUploaded,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      setProgress("Reading file…");

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("sessionId", sessionId);

        setProgress("Processing database…");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          onUploadError(data.error ?? "Upload failed. Please try again.");
          return;
        }

        onUploadSuccess(data.data);
      } catch {
        onUploadError("Network error. Please check your connection and try again.");
      } finally {
        setIsUploading(false);
        setProgress("");
      }
    },
    [sessionId, onUploadSuccess, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "application/vnd.ms-excel": [".xls"],
        "text/csv": [".csv"],
      },
      maxFiles: 1,
      maxSize: 10 * 1024 * 1024,
      disabled: isUploading,
    });

  const rejectionMsg =
    fileRejections[0]?.errors[0]?.code === "file-too-large"
      ? "File is too large. Maximum size is 10 MB."
      : fileRejections[0]?.errors[0]?.message ?? null;

  return (
    <div className="w-full space-y-2">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center
          cursor-pointer outline-none select-none
          transition-all duration-200
          ${isDragActive
            ? "border-violet-400 bg-violet-500/10 scale-[1.01]"
            : isUploaded
            ? "border-emerald-500/40 bg-emerald-500/[0.04]"
            : isUploading
            ? "border-white/20 bg-white/[0.03] pointer-events-none opacity-80"
            : "border-white/[0.15] bg-white/[0.03] hover:border-violet-400/50 hover:bg-violet-500/[0.04]"
          }
        `}
        aria-label="Excel file upload dropzone"
        role="button"
        tabIndex={0}
      >
        <input {...getInputProps()} aria-label="Upload Excel or CSV file" />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3 py-1">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
            </div>
            <p className="text-violet-300 text-sm font-medium">{progress}</p>
          </div>
        ) : isUploaded ? (
          <div className="flex flex-col items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="text-emerald-400 font-semibold text-sm">
                Database loaded
              </p>
              <p className="text-white/30 text-xs mt-0.5">
                Drop a new file to replace
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-1">
            <div
              className={`
                w-12 h-12 rounded-2xl flex items-center justify-center
                border transition-all duration-200
                ${isDragActive
                  ? "bg-violet-500/30 border-violet-400/60"
                  : "bg-violet-500/15 border-violet-500/25"
                }
              `}
            >
              <svg
                className={`w-6 h-6 transition-colors ${isDragActive ? "text-violet-300" : "text-violet-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            <div>
              <p className="text-white/80 font-semibold text-sm">
                {isDragActive ? "Release to upload" : "Upload Student Database"}
              </p>
              <p className="text-white/40 text-xs mt-1">
                Drag & drop or{" "}
                <span className="text-violet-400 underline underline-offset-2">
                  click to browse
                </span>
              </p>
              <p className="text-white/25 text-xs mt-1.5">
                .xlsx · .xls · .csv · Max 10 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {rejectionMsg && (
        <p role="alert" className="text-red-400 text-xs text-center">
          {rejectionMsg}
        </p>
      )}
    </div>
  );
}
