import { describe, expect, it } from "vitest";
import { inputToDb, toBuchung } from "@/lib/transactions";

describe("CRUD mapping", () => {
  it("round-trips an expense through the database shape", () => {
    const input = {
      typ: "ausgabe" as const,
      kategorieId: "Bürobedarf",
      konto: "4930",
      bezeichnung: "Papier",
      datum: "2026-02-03",
      betragCent: 1250,
    };
    const db = inputToDb(input);
    const buchung = toBuchung({
      id: "11111111-1111-4111-8111-111111111111",
      category: db.category,
      account: db.account,
      description: db.description,
      date: db.date,
      incomeCents: db.incomeCents,
      expenseCents: db.expenseCents,
    });
    expect(buchung.typ).toBe("ausgabe");
    expect(buchung.betragCent).toBe(1250);
    expect(buchung.datum).toBe("2026-02-03");
    expect(buchung.kategorieId).toBe("Bürobedarf");
  });

  it("round-trips an income through the database shape", () => {
    const db = inputToDb({
      typ: "einnahme",
      kategorieId: "",
      konto: "8200",
      rechnungsnummer: "RE-1",
      bezeichnung: "Lizenz",
      datum: "2026-01-15",
      betragCent: 120000,
    });
    expect(db.incomeCents).toBe(120000n);
    expect(db.expenseCents).toBe(0n);
    expect(db.category).toBe("");
    expect(db.invoiceNumber).toBe("RE-1");
  });

  it("stores an expense without a category and without an invoice number", () => {
    const db = inputToDb({
      typ: "ausgabe",
      kategorieId: "",
      konto: "",
      rechnungsnummer: "RE-9",
      bezeichnung: "Porto",
      datum: "2026-01-15",
      betragCent: 420,
    });
    expect(db.category).toBe("");
    expect(db.account).toBe("");
    expect(db.invoiceNumber).toBeNull();
    const buchung = toBuchung({
      id: "33333333-3333-4333-8333-333333333333",
      category: db.category,
      account: db.account,
      description: db.description,
      date: db.date,
      incomeCents: db.incomeCents,
      expenseCents: db.expenseCents,
      invoiceNumber: "RE-9",
    });
    expect(buchung.kategorieId).toBe("");
    expect(buchung.rechnungsnummer).toBeUndefined();
  });

  it("stores 70 percent of a Bewirtungskosten gross amount", () => {
    const db = inputToDb({
      typ: "ausgabe",
      kategorieId: "Bewirtungskosten",
      konto: "4650",
      bezeichnung: "Geschäftsessen",
      datum: "2026-03-05",
      betragCent: 7000,
      bruttoCent: 10000,
    });
    expect(db.expenseCents).toBe(7000n);
    expect(db.grossCents).toBe(10000n);
    const buchung = toBuchung({
      id: "22222222-2222-4222-8222-222222222222",
      category: db.category,
      account: db.account,
      description: db.description,
      date: db.date,
      incomeCents: db.incomeCents,
      expenseCents: db.expenseCents,
      grossCents: db.grossCents,
    });
    expect(buchung.betragCent).toBe(7000);
    expect(buchung.bruttoCent).toBe(10000);
  });
});
