import { describe, expect, it } from "vitest";
import { inputToDb } from "@/lib/transactions";
import { buchungInputSchema, csvRowSchema, homeAddressSchema } from "@/lib/validation";

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
      kategorieId: "",
      rechnungsnummer: " RE-12 ",
    });
    expect(income.incomeCents).toBe(6790n);
    expect(income.expenseCents).toBe(0n);
    expect(income.category).toBe("");
    expect(income.invoiceNumber).toBe("RE-12");
  });

  it("rejects a category on income and allows an expense without one", () => {
    expect(
      buchungInputSchema.safeParse({ ...valid, typ: "einnahme", kategorieId: "" }).success,
    ).toBe(true);
    expect(
      buchungInputSchema.safeParse({
        ...valid,
        typ: "einnahme",
        kategorieId: "Bürobedarf",
      }).success,
    ).toBe(false);
    expect(buchungInputSchema.safeParse({ ...valid, kategorieId: "" }).success).toBe(true);
  });

  it("keeps invoice numbers on income and rejects them on expenses", () => {
    expect(
      buchungInputSchema.parse({
        ...valid,
        typ: "einnahme",
        kategorieId: "",
        rechnungsnummer: "  RE-12  ",
      }).rechnungsnummer,
    ).toBe("RE-12");
    expect(
      buchungInputSchema.safeParse({
        ...valid,
        typ: "einnahme",
        kategorieId: "",
        rechnungsnummer: "R".repeat(65),
      }).success,
    ).toBe(false);
    expect(
      buchungInputSchema.safeParse({ ...valid, rechnungsnummer: "RE-1" }).success,
    ).toBe(false);
    expect(inputToDb({ ...valid, rechnungsnummer: "RE-1" }).invoiceNumber).toBeNull();
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

describe("home address", () => {
  it("stores a trimmed address and allows clearing it", () => {
    expect(homeAddressSchema.parse({ address: "  Heidelberg  " }).address).toBe(
      "Heidelberg",
    );
    expect(homeAddressSchema.parse({ address: "   " }).address).toBe("");
  });

  it("rejects an address that is too short or too long", () => {
    expect(homeAddressSchema.safeParse({ address: "A" }).success).toBe(false);
    expect(homeAddressSchema.safeParse({ address: "A".repeat(201) }).success).toBe(
      false,
    );
  });
});
