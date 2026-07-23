import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DocumentUpload } from "@/components/upload/document-upload";
import { ChatPanel } from "@/components/chat/chat-panel";
import { DocumentList } from "@/components/documents/document-list";
import { getDailyQueryVolume } from "@/lib/analytics";
import { UsageChart } from "@/components/dashboard/usage-chart";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
  });
  if (!membership) redirect("/login");

  const documents = await db.document.findMany({
    where: { workspaceId: membership.workspaceId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const usageData = await getDailyQueryVolume(membership.workspaceId);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-semibold">{membership.workspace.name}</h1>
      <DocumentUpload workspaceId={membership.workspaceId} />
      <div className="mt-8">
        <ChatPanel workspaceId={membership.workspaceId} />
      </div>
      <div className="mt-8">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading documents…</div>}>
          <DocumentList
            workspaceId={membership.workspaceId}
            initialDocuments={documents.map((d) => ({
              id: d.id,
              title: d.title,
              status: d.status,
              createdAt: d.createdAt.toISOString(),
            }))}
          />
        </Suspense>
        <div className="mt-8">
        <h2 className="mb-2 text-sm font-medium">Activity (last 14 days)</h2>
        <UsageChart data={usageData} />
      </div>
      </div>
    </div>
  );
}