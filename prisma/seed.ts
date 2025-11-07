import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureRole(userId: string, role: Role) {
  const existing = await prisma.roleAssignment.findFirst({
    where: { userId, role },
  });
  if (!existing) {
    await prisma.roleAssignment.create({ data: { userId, role } });
  }
}

async function main() {
  const userId = process.env.SEED_USER_ID ?? "user_admin";
  const email = process.env.SEED_USER_EMAIL ?? "admin@example.com";
  const name = process.env.SEED_USER_NAME ?? "Admin";

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: { email, name },
    create: { id: userId, email, name },
  });

  await Promise.all([
    ensureRole(user.id, "ADMIN"),
    ensureRole(user.id, "RESEARCHER"),
    ensureRole(user.id, "BOT_OPERATOR"),
  ]);

  const manifest = {
    name: "RSI Band",
    version: "seed",
    params: [
      { key: "rsi_len", label: "RSI Length", type: "int", default: 14 },
      { key: "rsi_buy", label: "RSI Buy", type: "int", default: 30 },
      { key: "rsi_sell", label: "RSI Sell", type: "int", default: 70 },
    ],
    entrypoint: "main.py",
  };

  const strategy = await prisma.strategy.upsert({
    where: { slug: "rsi-band" },
    update: { name: "RSI Band", ownerId: user.id, manifest },
    create: {
      id: "str_rsi_band",
      slug: "rsi-band",
      name: "RSI Band",
      ownerId: user.id,
      manifest,
    },
  });

  const version = await prisma.strategyVersion.create({
    data: {
      strategyId: strategy.id,
      versionTag: "seed",
      s3Key: "strategies/rsi-band/seed/main.py",
      manifest,
      createdById: user.id,
    },
  });

  await prisma.strategy.update({
    where: { id: strategy.id },
    data: { latestVersionId: version.id },
  });

  await prisma.run.upsert({
    where: { id: "r_seed_001" },
    update: {
      status: "SUCCEEDED",
      kpis: {
        cagr: 0.37,
        mdd: -0.21,
        sharpe: 1.2,
        trades: 322,
      },
    },
    create: {
      id: "r_seed_001",
      strategyId: strategy.id,
      ownerId: user.id,
      kind: "BACKTEST",
      status: "SUCCEEDED",
      artifactPrefix: "runs/r_seed_001/",
      spec: {
        exchange: "binance",
        pair: "BTC/USDT",
        timeframe: "1h",
        start: "2024-01-01",
        end: "2024-03-01",
      },
      params: { rsi_len: 14, rsi_buy: 30, rsi_sell: 70 },
      kpis: {
        cagr: 0.37,
        mdd: -0.21,
        sharpe: 1.2,
        trades: 322,
      },
    },
  });

  await prisma.bot.upsert({
    where: { id: "bot_seed_001" },
    update: {
      status: "RUNNING",
    },
    create: {
      id: "bot_seed_001",
      name: "RSI Band Bot",
      mode: "paper",
      status: "RUNNING",
      equity: 10234.5,
      dayPnl: 123.45,
      pairlist: ["BTC/USDT", "ETH/USDT"],
      strategyId: strategy.id,
      ownerId: user.id,
      configKey: "bots/bot_seed_001/config.json",
    },
  });

  console.log("Database seeded.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
