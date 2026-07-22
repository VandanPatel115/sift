import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { retrieveRelevantChunks } from "@/lib/rag/retrieve";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateWithRetry(
  params: Parameters<typeof ai.models.generateContentStream>[0],
  maxRetries = 2
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContentStream(params);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      const isRetryable = status === 503 || status === 429;
      if (isRetryable && attempt < maxRetries) {
        console.warn(`Gemini call failed with ${status}, retrying (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { conversationId, workspaceId, question } = await req.json();

  let convoId: string = conversationId;
  if (!convoId) {
    const convo = await db.conversation.create({
      data: { workspaceId, title: question.slice(0, 60), createdById: session.user.id },
    });
    convoId = convo.id;
  }

  const chunks = await retrieveRelevantChunks(question, workspaceId);

  if (chunks.length === 0) {
    return new Response(
      "I couldn't find anything relevant in this workspace's documents yet. Try uploading a document first, or rephrase your question.",
      { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Conversation-Id": convoId } }
    );
  }

  const context = chunks.map((c, i) => `[${i + 1}] (${c.documentTitle})\n${c.content}`).join("\n\n");
  const citations = chunks.map((c, i) => ({ index: i + 1, documentId: c.documentId, documentTitle: c.documentTitle }));

  await db.message.create({ data: { conversationId: convoId, role: "user", content: question } });

  let stream;
  try {
    stream = await generateWithRetry({
      model: "gemini-3.1-flash-lite",
      contents: `Context:\n${context}\n\nQuestion: ${question}`,
      config: {
        systemInstruction:
          "Answer only from the provided context. Cite sources inline as [1], [2], etc., matching the numbered context blocks. If the context doesn't contain the answer, say so plainly instead of guessing.",
      },
    });
  } catch (err) {
    console.error("Gemini generateContentStream failed after retries:", err);
    return new Response("The AI service is temporarily unavailable. Please try again in a moment.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Conversation-Id": convoId },
    });
  }

  const encoder = new TextEncoder();
  let fullText = "";

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.text ?? "";
        fullText += text;
        controller.enqueue(encoder.encode(text));
      }
      await db.message.create({
        data: { conversationId: convoId, role: "assistant", content: fullText, citations },
      });
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Conversation-Id": convoId,
      "X-Citations": encodeURIComponent(JSON.stringify(citations)),
    },
  });
}