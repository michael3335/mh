// app/api/models/bots/[id]/restart/route.ts
export async function POST(_: Request, { params }: { params: { id: string } }) {
  return Response.json({ ok: true, id: params.id, action: "restart" });
}
