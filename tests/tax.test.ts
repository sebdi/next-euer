import { describe, expect, it } from "vitest";
import { expectedIncomeTaxCents, parseTaxRateInput } from "@/lib/tax";
import { profileSettingsSchema } from "@/lib/validation";

describe("marginal tax rate", () => {
  it("reads a percent into basis points and allows clearing it", () => {
    expect(parseTaxRateInput("42")).toBe(4_200);
    expect(parseTaxRateInput("42,5")).toBe(4_250);
    expect(parseTaxRateInput("  ")).toBe(null);
    expect(parseTaxRateInput("101")).toBe("invalid");
  });

  it("estimates income tax from a positive EÜR profit", () => {
    expect(expectedIncomeTaxCents(1_000_000, 4_200)).toBe(420_000);
    expect(expectedIncomeTaxCents(1, 5_000)).toBe(1);
    expect(expectedIncomeTaxCents(1, 4_200)).toBe(0);
  });

  it("estimates no tax for a loss and nothing without a rate", () => {
    expect(expectedIncomeTaxCents(-50_000, 4_200)).toBe(0);
    expect(expectedIncomeTaxCents(50_000, null)).toBe(null);
  });

  it("accepts profile settings with an optional rate", () => {
    expect(
      profileSettingsSchema.parse({ address: "Heidelberg", taxRate: "42,50" }).taxRate,
    ).toBe("42,50");
    expect(profileSettingsSchema.safeParse({ address: "", taxRate: "" }).success).toBe(
      true,
    );
    expect(
      profileSettingsSchema.safeParse({ address: "A", taxRate: "42" }).success,
    ).toBe(false);
  });
});