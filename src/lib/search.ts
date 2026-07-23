import { db } from "@/lib/db";

export async function searchDocuments(workspaceId: string, query: string) {
  return db.$queryRaw<{ id: string; title: string; status: string; createdAt: Date }[]>`
    SELECT id, title, status, "createdAt"
    FROM "Document"
    WHERE "workspaceId" = ${workspaceId}
      AND "deletedAt" IS NULL
      AND title ILIKE '%' || ${query} || '%'
    ORDER BY "createdAt" DESC
    LIMIT 25
  `;
}