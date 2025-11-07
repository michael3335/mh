import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/authz";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const authz = requireRole(session, "botOperator");
  if (!authz.ok) return authz.response;
  const { id } = await ctx.params;
  // TODO: stop bot
  return Response.json({ ok: true, id, action: "stop" });
}
