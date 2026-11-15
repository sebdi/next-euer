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
      kategorieId: "Nutzungseinnahme",
      konto: "8200",
      bezeichnung: "Lizenz",
      datum: "2026-01-15",
      betragCent: 120000,
    });
    expect(db.incomeCents).toBe(120000n);
    expect(db.expenseCents).toBe(0n);
  });
});
