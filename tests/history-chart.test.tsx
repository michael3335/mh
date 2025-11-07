import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/Crosshair", () => ({
  __esModule: true,
  default: () => <div data-testid="crosshair-mock" />,
}));

import { HistoryChart } from "@/components/HistoryModal";

describe("HistoryChart", () => {
  it("renders placeholder when no data is provided", () => {
    render(<HistoryChart data={[]} unitLabel="USD/oz" />);
    expect(screen.getByText(/No data/i)).toBeInTheDocument();
  });

  it("renders change summary when series exists", () => {
    const sample = [
      { date: "2024-01-01", value: 10 },
      { date: "2024-01-02", value: 15 },
    ];
    render(<HistoryChart data={sample} unitLabel="USD/oz" />);
    expect(screen.getByText(/Change:/i)).toBeInTheDocument();
  });
});
