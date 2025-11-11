This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Authorization Roles

All `/api/models/**` routes now require explicit roles:

- `AUTH_RESEARCHERS`: comma-separated list of emails, GitHub handles, or user IDs that may create strategies, queue research jobs, and inspect runs.
- `AUTH_BOT_OPERATORS`: identities allowed to view or control bots.
- `AUTH_ALLOW_ALL=true`: optional escape hatch for local development to treat every signed-in session as having all roles.
- `SQS_PROMOTION_JOBS_URL`: queue that receives promotion jobs (run → bot).

Use `*` inside either list to grant access to everyone (e.g. `AUTH_RESEARCHERS=*`).

## Tests & Tooling

Run the full suite locally before pushing:

```bash
npm run lint
npm run test
```

`npm run test` uses Vitest + Testing Library (jsdom) to cover auth guards and UI regressions (e.g. `HistoryChart` rendering).

## Runs dashboard

- `/models/runs` lists your last 25 runs from Postgres (or S3 metrics fallback) and links to `/models/runs/[id]`.
- `/models/runs/[id]` fetches `metrics.json`, `equity.csv`, `drawdown.csv`, and `trades.csv` through the new artifact proxy at `/api/models/runs/[id]/artifacts/<asset>` and renders inline ASCII-style charts/tables.
- `research-worker` now emits `equity.csv`, `drawdown.csv`, `trades.csv`, and `logs.txt` for every run; `grid`/`walkforward` parents aggregate KPIs for dashboards.

## Research engine (Freqtrade + ccxt + parquet cache)

- `research-worker/worker.py` still downloads historical OHLCV via **ccxt**, caches each year under `s3://<bucket>/data/{exchange}/{pair}/{tf}/{yyyy}.parquet`, and reuses those parquet files before hitting the exchanges again.
- Downloaded strategy files are mounted into a temporary freqtrade workspace and executed through the real freqtrade backtesting command, so whatever you write in an `IStrategy` class (from the editor) is what gets simulated.
- UI “Parameters” are injected into the freqtrade config under `self.config["model_params"]`, so strategies can react to sliders/inputs without touching config files.
- Every job uploads `equity.csv`, `drawdown.csv`, `trades.csv`, and `logs.txt` emitted by freqtrade, so the UI can render charts/tables without re-running the worker.

### Running the research worker locally

1. Install the native TA-Lib libraries (macOS: `brew install ta-lib`, Debian/Ubuntu: `apt install libta-lib0 libta-lib0-dev`).
2. Install the Python deps once: `python3 -m pip install -r research-worker/requirements.txt && python3 -m pip install --no-deps freqtrade==2024.5`.
3. Export the same env vars the Next.js API needs (`AWS_REGION`, `S3_BUCKET`, `SQS_RESEARCH_JOBS_URL`, `DATABASE_URL`, credentials, etc.).
4. Start the worker alongside `npm run dev`:
   ```bash
   npm run worker
   # or: python3 research-worker/worker.py
   ```
   The process will tail SQS, execute freqtrade backtests, upload artifacts, and update the `Run` rows so the UI advances from `QUEUED` → `RUNNING` → `SUCCEEDED`/`FAILED`.

## Bots dashboard & promotion status

- `/api/models/bots` now enriches DB rows with the latest S3 state snapshot (`bots/{id}/state.json`), tail of the live log stream (`bots/{id}/logs/latest.txt`), and the most recent promotion record from Postgres.
- `/models/bots` renders those snapshots inline (JSON block + log tail) and surfaces the latest promotion status (target, run ID, timestamp) so operators can see whether a “Promote to paper/live” job succeeded.
- Cards auto-refresh every 15 seconds to provide a pseudo-live log tail and state view without opening CloudWatch.

## Infrastructure-as-code

- `infra/terraform` provisions the entire pipeline: versioned S3 bucket with lifecycle rules, RDS Postgres, SQS queues (research + promotion), ECS cluster/services for both workers, IAM task roles, CloudWatch dashboards, and queue-depth alarms.
- Supply your VPC subnet + security group IDs, execution role ARN, and worker ECR images; Terraform outputs queue URLs and task definition ARNs you can feed into Next.js env vars or CI deploy scripts.

## Database (Postgres + Prisma)

Metadata for users, strategies, runs, and bots lives in Postgres via Prisma. To work locally:

1. Set `DATABASE_URL=postgresql://user:pass@host:port/db`.
2. Adjust `prisma/schema.prisma` as needed, then run `npx prisma migrate dev` to create tables.
3. Generate the client with `npx prisma generate` (run automatically in CI).
4. Seed roles by inserting `RoleAssignment` rows so API role checks work without the legacy env vars.
5. Export `DATABASE_URL` plus any queue/bucket env vars (`SQS_RESEARCH_JOBS_URL`, `SQS_PROMOTION_JOBS_URL`, `AWS_S3_BUCKET`, etc.) before starting the Next.js server.

If no `DATABASE_URL` is configured, the API transparently falls back to S3 mock data so the UI remains usable.
