import { db } from "@/lib/db";
import { embedChunks } from "@/lib/ingestion/embed";

export interface RetrievedChunk {
  id: string;
  content: string;
  documentId: string;
  documentTitle: string;
  distance: number;
}

export async function retrieveRelevantChunks(
  query: string,
  workspaceId: string,
  topK = 6
): Promise<RetrievedChunk[]> {
  const [queryEmbedding] = await embedChunks([query]);
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;

  return db.$queryRaw<RetrievedChunk[]>`
    SELECT c.id, c.content, c."documentId", d.title AS "documentTitle",
           c.embedding <=> ${vectorLiteral}::vector AS distance
    FROM "DocumentChunk" c
    JOIN "Document" d ON d.id = c."documentId"
    WHERE d."workspaceId" = ${workspaceId} AND d.status = 'ready'
    ORDER BY distance ASC
    LIMIT ${topK}
  `;
}