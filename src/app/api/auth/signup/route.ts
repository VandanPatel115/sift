import { NextRequest, NextResponse } from "next/server";
import { hash } from "@node-rs/argon2";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Email and a password of at least 8 characters are required" },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await hash(password);
  const user = await db.user.create({ data: { name, email, passwordHash } });
  const slug = `${email.split("@")[0]}-${Math.random().toString(36).slice(2, 7)}`;

  await db.workspace.create({
    data: {
      name: name ? `${name}'s Workspace` : "My Workspace",
      slug,
      members: { create: { userId: user.id, role: "owner" } },
    },
  });

  return NextResponse.json({ ok: true });
}