import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

const hasDatabase = () => Boolean(process.env.DATABASE_URL);

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const authz = await requireRole(session, "botOperator");
  if (!authz.ok) return authz.response;

  if (!hasDatabase()) {
    return Response.json(
      { error: "DATABASE_URL not configured" },
      { status: 500 }
    );
  }

  const { id } = await ctx.params;

  const ownerId = getSessionUserId(session);
  const bot = await prisma.bot.findUnique({ where: { id } });
  if (!bot) {
    return Response.json({ error: "Bot not found" }, { status: 404 });
  }
  if (ownerId && bot.ownerId && bot.ownerId !== ownerId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.bot.update({
    where: { id },
    data: { status: "STOPPING" },
  });

  return Response.json({ ok: true, id, action: "stop" });
}
