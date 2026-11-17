import { describe, expect, it } from "vitest";
import {
  guessImportMapping,
  mapCsvTable,
  mappingProblem,
  readCsvTable,
} from "@/lib/csv-import";
import { parseSignedBetrag } from "@/lib/money";

describe("generic CSV import", () => {
  it("detects a comma-separated file and proposes the matching columns", () => {
    const loaded = readCsvTable(
      "Buchungstag,Verwendungszweck,Umsatz\n2026-01-15,Honorar,10.00\n15/01/2026,Porto,-4.20\n",
      true,
    );
    expect("table" in loaded).toBe(true);
    if (!("table" in loaded)) return;
    const mapping = guessImportMapping(loaded.table.headers);
    expect(loaded.table.headers).toEqual(["Buchungstag", "Verwendungszweck", "Umsatz"]);
    expect(mapping.date).toBe(0);
    expect(mapping.description).toBe(1);
    expect(mapping.amount).toBe(2);
    const result = mapCsvTable(loaded.table, mapping, true);
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0]).toMatchObject({
      description: "Honorar",
      date: "2026-01-15",
      incomeCents: 1000,
      expenseCents: 0,
    });
    expect(result.valid[1]).toMatchObject({
      description: "Porto",
      expenseCents: 420,
      incomeCents: 0,
    });
  });

  it("recognizes the NextEÜR export headers", () => {
    const loaded = readCsvTable(
      "Art;Konto;Bezeichnung;Datum;Einnahmen;Ausgaben;Rechnungsnummer\n;8400;Honorar;15.01.2026;10,00;;RE-9\n",
      true,
    );
    if (!("table" in loaded)) throw new Error("table missing");
    const mapping = guessImportMapping(loaded.table.headers);
    expect(mapping.category).toBe(0);
    expect(mapping.invoiceNumber).toBe(6);
    const result = mapCsvTable(loaded.table, mapping, true);
    expect(result.valid[0]?.invoiceNumber).toBe("RE-9");
    expect(result.valid[0]?.incomeCents).toBe(1000);
  });

  it("can treat the first row as data", () => {
    const loaded = readCsvTable("Honorar;15.01.2026;10,00\n", false);
    if (!("table" in loaded)) throw new Error("table missing");
    expect(loaded.table.headers).toEqual(["Spalte 1", "Spalte 2", "Spalte 3"]);
    const result = mapCsvTable(
      loaded.table,
      {
        description: 0,
        date: 1,
        income: 2,
        expense: null,
        amount: null,
        category: null,
        account: null,
        invoiceNumber: null,
      },
      false,
    );
    expect(result.rows[0]?.line).toBe(1);
    expect(result.valid[0]?.description).toBe("Honorar");
  });

  it("rejects a mapping that uses one column twice", () => {
    expect(
      mappingProblem(
        {
          description: 0,
          date: 0,
          income: null,
          expense: null,
          amount: 1,
          category: null,
          account: null,
          invoiceNumber: null,
        },
        2,
      ),
    ).toMatch(/einmal/);
  });

  it("reads a trailing minus as a negative amount", () => {
    expect(parseSignedBetrag("12,50-")).toBe(-1250);
    expect(parseSignedBetrag("(4,20)")).toBe(-420);
    expect(parseSignedBetrag("")).toBeNull();
  });
});
