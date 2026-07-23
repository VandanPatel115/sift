import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractTextFromPdf } from "@/lib/ingestion/extract";
import { chunkText } from "@/lib/ingestion/chunk";
import { embedChunks } from "@/lib/ingestion/embed";
import { requireRole, logAction } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const workspaceId = formData.get("workspaceId") as string;

  if (!file || file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds 20MB limit" }, { status: 400 });
  }

  try {
    await requireRole(session.user.id, workspaceId, "member");
  } catch {
    return NextResponse.json({ error: "You don't have permission to upload documents here" }, { status: 403 });
  }

  const blob = await put(file.name, file, { access: "public" });

  const document = await db.document.create({
    data: {
      workspaceId,
      title: file.name,
      fileUrl: blob.url,
      mimeType: file.type,
      sizeBytes: file.size,
      status: "processing",
      uploadedById: session.user.id,
    },
  });

  await logAction(workspaceId, session.user.id, "document.upload", "Document", document.id, { title: file.name });

  processDocument(document.id, blob.url).catch(async (err) => {
    console.error(`Document processing failed for ${document.id}:`, err);
    await db.document.update({ where: { id: document.id }, data: { status: "failed" } });
  });

  return NextResponse.json({ document });
}

async function processDocument(documentId: string, fileUrl: string) {
  const text = await extractTextFromPdf(fileUrl);
  const chunks = chunkText(text);
  const embeddings = await embedChunks(chunks);

  for (let i = 0; i < chunks.length; i++) {
    const vectorLiteral = `[${embeddings[i].join(",")}]`;
    await db.$executeRaw`
      INSERT INTO "DocumentChunk" (id, "documentId", content, embedding, "chunkIndex", "tokenCount")
      VALUES (gen_random_uuid()::text, ${documentId}, ${chunks[i]}, ${vectorLiteral}::vector, ${i}, ${Math.ceil(chunks[i].length / 4)})
    `;
  }

  await db.document.update({ where: { id: documentId }, data: { status: "ready" } });
}