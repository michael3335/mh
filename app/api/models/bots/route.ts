// app/api/models/bots/route.ts
export async function GET() {
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
