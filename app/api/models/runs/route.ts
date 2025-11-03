// app/api/models/runs/route.ts
export async function GET() {
  // TODO: replace with DB query ordering by createdAt desc
  const runs = [
    {
      id: "r_001",
      strategyName: "RSI_Band",
      kind: "backtest",
      status: "SUCCEEDED",
      startedAt: "2025-01-10T12:10:00Z",
      finishedAt: "2025-01-10T12:12:20Z",
      kpis: { cagr: 0.41, mdd: -0.23, sharpe: 1.3, trades: 812 },
    },
    {
      id: "r_002",
      strategyName: "Breakout_v2",
      kind: "grid",
      status: "RUNNING",
      startedAt: "2025-01-10T13:00:00Z",
    },
  ];
  return Response.json({ runs });
}
