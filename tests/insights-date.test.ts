import { describe, expect, it } from "vitest";
import {
  compareMetaDatesDesc,
  formatMetaDate,
  parseMetaDate,
} from "@/lib/insights/date";

describe("parseMetaDate", () => {
  it("parses ISO strings", () => {
    const parsed = parseMetaDate("2024-05-21T00:00:00Z");
    expect(parsed?.getUTCFullYear()).toBe(2024);
    expect(parsed?.getUTCMonth()).toBe(4);
    expect(parsed?.getUTCDate()).toBe(21);
  });

  it("parses display strings with timezone suffix", () => {
    const parsed = parseMetaDate("2024-05-21 11:32 GMT+10");
    expect(parsed).not.toBeNull();
  });
});

describe("formatMetaDate", () => {
  it("formats friendly dates", () => {
    expect(formatMetaDate("2024-05-21")).toBe("21 May 2024");
  });

  it("falls back to the raw string when parsing fails", () => {
    expect(formatMetaDate("not a date")).toBe("not a date");
  });
});

describe("compareMetaDatesDesc", () => {
  it("orders newest first and pushes invalid dates last", () => {
    const items = [
      { date: "2024-05-01" },
      { date: "2024-05-03" },
      { date: "not valid" },
    ];

    items.sort((a, b) => compareMetaDatesDesc(a.date, b.date));

    expect(items.map((i) => i.date)).toEqual([
      "2024-05-03",
      "2024-05-01",
      "not valid",
    ]);
  });
});
