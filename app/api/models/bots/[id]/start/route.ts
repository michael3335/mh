// app/api/models/bots/[id]/start/route.ts
export async function POST(_: Request, { params }: { params: { id: string } }) {
  // TODO: kick ECS service or send SQS to promotion/execution worker
  return Response.json({ ok: true, id: params.id, action: "start" });
}
