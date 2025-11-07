// app/api/models/bots/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAnyRole } from "@/lib/authz";

export async function GET() {
  const session = await getServerSession(authOptions);
  const authz = requireAnyRole(session, ["botOperator", "researcher"]);
  if (!authz.ok) return authz.response;
  // TODO: read from DB or ECS service discovery
  const bots = [
    {
      id: "b_001",
      name: "RSI_Band / paper",
      mode: "paper",
      status: "RUNNING",
      equity: 10432.1,
      dayPnl: 123.4,
      pairlist: ["BTC/USDT", "ETH/USDT"],
    },
    {
      id: "b_002",
      name: "Breakout_v2 / paper",
      mode: "paper",
      status: "STOPPED",
      equity: 10000,
      dayPnl: 0,
      pairlist: ["SOL/USDT"],
    },
  ];
  return Response.json({ bots });
}
