import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

const ROLE_RANK = { viewer: 0, member: 1, admin: 2, owner: 3 } as const;
type RoleName = keyof typeof ROLE_RANK;

export async function requireRole(userId: string, workspaceId: string, minRole: RoleName) {
  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership || ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
    throw new Error("FORBIDDEN");
  }
  return membership;
}

export async function logAction(
  workspaceId: string,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Prisma.InputJsonValue
) {
  await db.auditLog.create({
    data: { workspaceId, actorId, action, targetType, targetId, metadata },
  });
}