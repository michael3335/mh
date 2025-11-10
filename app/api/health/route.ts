export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  return Response.json({
    ok: true,
    service: "api",
    timestamp: new Date().toISOString(),
  });
}
