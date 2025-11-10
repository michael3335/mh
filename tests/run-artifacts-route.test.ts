import { describe, expect, it, vi, beforeEach } from "vitest";

const sendMock = vi.fn();

vi.mock("@/lib/s3", () => ({
  s3: { send: sendMock },
  BUCKET: "test-bucket",
}));

vi.mock("@/lib/authz", () => ({
  requireRole: async () => ({ ok: true }),
}));

vi.mock("next-auth", () => ({
  getServerSession: () => Promise.resolve({ user: { id: "user-123" } }),
}));

const resolveArtifactPrefixMock = vi.fn().mockResolvedValue(null);

vi.mock("@/lib/run-artifacts", () => ({
  resolveArtifactPrefix: resolveArtifactPrefixMock,
}));

const route = () =>
  import("@/app/api/models/runs/[id]/artifacts/[asset]/route");

function streamFromString(value: string) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(value));
      controller.close();
    },
  });
}

describe("GET /api/models/runs/[id]/artifacts/[asset]", () => {
  beforeEach(() => {
    sendMock.mockReset();
    resolveArtifactPrefixMock.mockReset();
    resolveArtifactPrefixMock.mockResolvedValue(null);
  });

  it("rejects unsupported assets", async () => {
    const { GET } = await route();
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "r_1", asset: "unknown" }),
    });
    expect(res.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("streams known assets from S3", async () => {
    sendMock.mockResolvedValue({
      Body: { transformToWebStream: () => streamFromString("ts,value\n") },
      ContentType: "text/csv",
    });
    const { GET } = await route();
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "r_42", asset: "equity" }),
    });

    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const commandInput = sendMock.mock.calls[0][0].input;
    expect(commandInput.Key).toBe("runs/r_42/equity.csv");
  });

  it("uses DB artifact prefixes when available", async () => {
    resolveArtifactPrefixMock.mockResolvedValue("custom/prefix");
    sendMock.mockResolvedValue({
      Body: { transformToWebStream: () => streamFromString("ts,value\n") },
      ContentType: "text/csv",
    });
    const { GET } = await route();
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "r_db", asset: "logs" }),
    });
    expect(res.status).toBe(200);
    const commandInput = sendMock.mock.calls[0][0].input;
    expect(commandInput.Key).toBe("custom/prefix/logs.txt");
  });
});
