import { describe, expect, it } from "vitest";
import {
  isoDateToUtc,
  parseFlexibleDate,
  utcDateToIso,
  yearDateRange,
} from "@/lib/dates";

describe("year filtering", () => {
  it("uses an exclusive UTC end bound for the next year", () => {
    const range = yearDateRange(2026);
    expect(range.gte.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(range.lt.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("does not shift calendar dates when converting to UTC", () => {
    const date = isoDateToUtc("2026-12-31");
    expect(utcDateToIso(date)).toBe("2026-12-31");
    expect(date < yearDateRange(2026).lt).toBe(true);
    expect(date >= yearDateRange(2027).gte).toBe(false);
  });

  it("parses German and ISO dates", () => {
    expect(parseFlexibleDate("15.1.2026")).toBe("2026-01-15");
    expect(parseFlexibleDate("2026-01-15")).toBe("2026-01-15");
    expect(parseFlexibleDate("2026-01-15T10:30:00Z")).toBe("2026-01-15");
    expect(parseFlexibleDate("15/01/2026")).toBe("2026-01-15");
    expect(parseFlexibleDate("31.02.2026")).toBeNull();
  });
});
