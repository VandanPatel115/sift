import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireRole, logAction } from "@/lib/rbac";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const document = await db.document.findUnique({ where: { id } });
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ document });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const document = await db.document.findUnique({ where: { id } });
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await requireRole(session.user.id, document.workspaceId, "admin");
  } catch {
    return NextResponse.json({ error: "You don't have permission to delete this document" }, { status: 403 });
  }

  await db.document.update({ where: { id }, data: { deletedAt: new Date() } });
  await logAction(document.workspaceId, session.user.id, "document.delete", "Document", id, { title: document.title });

  return NextResponse.json({ ok: true });
}