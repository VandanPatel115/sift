"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type UploadState = "idle" | "uploading" | "processing" | "ready" | "failed";

export function DocumentUpload({ workspaceId }: { workspaceId: string }) {
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  const uploadFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setError("");
      setState("uploading");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("workspaceId", workspaceId);

      try {
        const res = await fetch("/api/documents", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Upload failed");
          setState("failed");
          return;
        }

        setState("processing");
        pollStatus(data.document.id);
      } catch {
        setError("Network error — check your connection and try again");
        setState("failed");
      }
    },
    [workspaceId]
  );

  const pollStatus = (documentId: string) => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/documents/${documentId}`);
      const data = await res.json();

      if (data.document.status === "ready") {
        clearInterval(interval);
        setState("ready");
        router.refresh();
      } else if (data.document.status === "failed") {
        clearInterval(interval);
        setError("Processing failed — the file may be corrupted or unreadable");
        setState("failed");
      }
    }, 2000);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const reset = () => {
    setState("idle");
    setFileName("");
    setError("");
  };

  if (state === "idle") {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragging ? "border-accent bg-accent/5" : "border-border"
        }`}
      >
        <p className="text-sm text-muted-foreground">
          Drag a PDF here, or
        </p>
        <label className="cursor-pointer text-sm font-medium text-accent underline underline-offset-4">
          browse your files
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file);
            }}
          />
        </label>
        <p className="text-xs text-muted-foreground">PDF only, up to 20MB</p>
      </div>
    );
  }

  if (state === "uploading") {
    return (
      <div className="flex items-center gap-3 rounded-xl border p-6">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm">Uploading {fileName}…</p>
      </div>
    );
  }

  if (state === "processing") {
    return (
      <div className="flex items-center gap-3 rounded-xl border p-6">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm">Reading and indexing {fileName}… this can take a minute for longer documents.</p>
      </div>
    );
  }

  if (state === "ready") {
    return (
      <div className="flex items-center justify-between rounded-xl border p-6">
        <p className="text-sm">{fileName} is ready to query.</p>
        <button onClick={reset} className="text-sm font-medium text-accent underline underline-offset-4">
          Upload another
        </button>
      </div>
    );
  }

  // failed
  return (
    <div className="flex items-center justify-between rounded-xl border border-destructive/50 bg-destructive/5 p-6">
      <p className="text-sm text-destructive">{error || "Something went wrong."}</p>
      <button onClick={reset} className="text-sm font-medium text-accent underline underline-offset-4">
        Try again
      </button>
    </div>
  );
}