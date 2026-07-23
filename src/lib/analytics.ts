import { db } from "@/lib/db";

export async function getDailyQueryVolume(workspaceId: string, days = 14) {
  const rows = await db.$queryRaw<{ day: Date; count: bigint }[]>`
    SELECT DATE_TRUNC('day', m."createdAt") AS day, COUNT(*) AS count
    FROM "Message" m
    JOIN "Conversation" c ON c.id = m."conversationId"
    WHERE c."workspaceId" = ${workspaceId}
      AND m.role = 'user'
      AND m."createdAt" >= NOW() - (${days} || ' days')::interval
    GROUP BY DATE_TRUNC('day', m."createdAt")
    ORDER BY day ASC
  `;

  return rows.map((r) => ({
    day: r.day.toISOString().slice(5, 10),
    count: Number(r.count),
  }));
}