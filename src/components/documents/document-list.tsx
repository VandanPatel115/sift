"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type DocumentRow = { id: string; title: string; status?: string; createdAt: string };

export function DocumentList({
  workspaceId,
  initialDocuments,
}: {
  workspaceId: string;
  initialDocuments: DocumentRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (q: string) => {
      const params = new URLSearchParams({ workspaceId, q });
      const res = await fetch(`/api/documents/search?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setDocuments(data.documents);
    },
    [workspaceId]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(query);
      const params = new URLSearchParams(window.location.search);
      if (query) params.set("q", query);
      else params.delete("q");
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch, router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document? This can't be undone from the UI.")) return;
    setDeletingId(id);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to delete document");
    }
    setDeletingId(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search documents by title…"
        className="rounded-md border px-3 py-2 text-sm"
      />
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {query ? "No documents match that search." : "No documents yet — upload one above."}
        </p>
      ) : (
        documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
            <span>{doc.title}</span>
            <div className="flex items-center gap-3">
              {doc.status && <span className="text-xs text-gray-500">{doc.status}</span>}
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="text-xs text-red-600 underline underline-offset-4 disabled:opacity-50"
              >
                {deletingId === doc.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}