import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";
import { searchDocuments } from "@/lib/search";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const q = searchParams.get("q")?.trim() ?? "";

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  try {
    await requireRole(session.user.id, workspaceId, "viewer");
  } catch {
    return NextResponse.json({ error: "You don't have access to this workspace" }, { status: 403 });
  }

  if (!q) {
    const documents = await db.document.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 25,
    });
    return NextResponse.json({ documents });
  }

  const documents = await searchDocuments(workspaceId, q);
  return NextResponse.json({ documents });
}