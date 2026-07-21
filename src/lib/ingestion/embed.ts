import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function embedChunks(chunks: string[]): Promise<number[][]> {
  const results = await Promise.all(
    chunks.map((chunk) =>
      ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: chunk,
        config: { outputDimensionality: 1536 },
      })
    )
  );
  return results.map((r) => r.embeddings![0].values!);
}