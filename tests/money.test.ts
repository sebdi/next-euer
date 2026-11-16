import { describe, expect, it } from "vitest";
import {
  bewirtungAbziehbarCents,
  bigintToCents,
  parseBetrag,
  profitCents,
} from "@/lib/money";

describe("monetary calculations", () => {
  it("computes profit with integer arithmetic", () => {
    expect(profitCents(10_000, 2_500)).toBe(7_500);
    expect(profitCents(100, 250)).toBe(-150);
    expect(profitCents(0, 0)).toBe(0);
  });

  it("parses German decimal formats into cents", () => {
    expect(parseBetrag("1.234,56")).toBe(123456);
    expect(parseBetrag("1234,56 €")).toBe(123456);
    expect(parseBetrag("12,5")).toBe(1250);
    expect(parseBetrag("12")).toBe(1200);
    expect(parseBetrag("1.234")).toBe(123400);
    expect(parseBetrag("12.50")).toBe(1250);
    expect(parseBetrag("0,01")).toBe(1);
  });

  it("rejects invalid amount strings", () => {
    expect(parseBetrag("")).toBeNull();
    expect(parseBetrag("12,345")).toBeNull();
    expect(parseBetrag("12,3,4")).toBeNull();
    expect(parseBetrag("-10")).toBeNull();
    expect(parseBetrag("abc")).toBeNull();
  });

  it("books 70 percent of Bewirtungskosten, rounded half-up", () => {
    expect(bewirtungAbziehbarCents(10_000)).toBe(7_000);
    expect(bewirtungAbziehbarCents(333)).toBe(233);
    expect(bewirtungAbziehbarCents(1)).toBe(1);
  });

  it("converts bigint amounts safely", () => {
    expect(bigintToCents(42n)).toBe(42);
    expect(() => bigintToCents(BigInt(Number.MAX_SAFE_INTEGER) + 1n)).toThrow();
  });
});
