import { NextRequest } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  // TODO: stop bot
  return Response.json({ ok: true, id, action: "stop" });
}
