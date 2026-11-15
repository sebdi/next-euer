import { describe, expect, it } from "vitest";
import { inputToDb } from "@/lib/transactions";
import { buchungInputSchema, csvRowSchema } from "@/lib/validation";

describe("transaction validation", () => {
  const valid = {
    kategorieId: "Bürobedarf" as const,
    konto: "4930",
    bezeichnung: "Druckerpapier",
    datum: "2026-02-03",
    typ: "ausgabe" as const,
    betragCent: 6790,
  };

  it("accepts a complete expense", () => {
    expect(buchungInputSchema.parse(valid).bezeichnung).toBe("Druckerpapier");
  });

  it("rejects an empty description", () => {
    const result = buchungInputSchema.safeParse({ ...valid, bezeichnung: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid date", () => {
    expect(buchungInputSchema.safeParse({ ...valid, datum: "2026-02-31" }).success).toBe(
      false,
    );
    expect(buchungInputSchema.safeParse({ ...valid, datum: "03.02.2026" }).success).toBe(
      false,
    );
  });

  it("rejects unknown categories", () => {
    expect(
      buchungInputSchema.safeParse({ ...valid, kategorieId: "Steuerberatung" }).success,
    ).toBe(false);
  });

  it("rejects zero and negative amounts", () => {
    expect(buchungInputSchema.safeParse({ ...valid, betragCent: 0 }).success).toBe(
      false,
    );
    expect(buchungInputSchema.safeParse({ ...valid, betragCent: -10 }).success).toBe(
      false,
    );
  });

  it("maps a booking to either income or expense cents", () => {
    const expense = inputToDb(valid);
    expect(expense.incomeCents).toBe(0n);
    expect(expense.expenseCents).toBe(6790n);

    const income = inputToDb({
      ...valid,
      typ: "einnahme",
      kategorieId: "Nutzungseinnahme",
    });
    expect(income.incomeCents).toBe(6790n);
    expect(income.expenseCents).toBe(0n);
  });

  it("rejects csv rows with both income and expense", () => {
    const result = csvRowSchema.safeParse({
      category: "Bürobedarf",
      account: "4930",
      description: "Mix",
      date: "2026-01-01",
      incomeCents: 100,
      expenseCents: 50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects csv rows where both amounts are zero", () => {
    const result = csvRowSchema.safeParse({
      category: "Bürobedarf",
      account: "4930",
      description: "Leer",
      date: "2026-01-01",
      incomeCents: 0,
      expenseCents: 0,
    });
    expect(result.success).toBe(false);
  });
});
