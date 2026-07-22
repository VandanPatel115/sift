import { ChatPanel } from "@/components/chat/chat-panel";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DocumentUpload } from "@/components/upload/document-upload";

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

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-semibold">{membership.workspace.name}</h1>
      <DocumentUpload workspaceId={membership.workspaceId} />
      <ChatPanel workspaceId={membership.workspaceId} />
      <div className="mt-8 flex flex-col gap-2">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
            <span>{doc.title}</span>
            <span className="text-xs text-gray-500">{doc.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}