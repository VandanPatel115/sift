"use client";

import { useState, useRef } from "react";

type Citation = { index: number; documentId: string; documentTitle: string };
type ChatMessage = { role: "user" | "assistant"; content: string; citations?: Citation[] };

export function ChatPanel({ workspaceId }: { workspaceId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationIdRef = useRef<string | undefined>(undefined);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const question = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversationIdRef.current, workspaceId, question }),
      });

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Something went wrong answering that — the AI service may be briefly overloaded. Try asking again.",
          },
        ]);
        setIsStreaming(false);
        return;
      }

      const convoId = res.headers.get("X-Conversation-Id");
      if (convoId) conversationIdRef.current = convoId;

      const citationsHeader = res.headers.get("X-Citations");
      const citations: Citation[] = citationsHeader ? JSON.parse(decodeURIComponent(citationsHeader)) : [];

      setMessages((prev) => [...prev, { role: "assistant", content: "", citations }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkText = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = { ...last, content: last.content + chunkText };
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error — check your connection and try again." },
      ]);
    }

    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user" ? "bg-black text-white" : "bg-gray-100"
              }`}
            >
              {m.content || (m.role === "assistant" && isStreaming ? "…" : "")}
            </div>
            {m.citations && m.citations.length > 0 && (
              <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                {m.citations.map((c) => (
                  <span key={c.index} className="rounded-full border px-2 py-0.5">
                    [{c.index}] {c.documentTitle}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={isStreaming}
          placeholder="Ask a question about your documents…"
          className="flex-1 rounded-md border px-3 py-2 text-sm disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isStreaming ? "…" : "Ask"}
        </button>
      </div>
    </div>
  );
}