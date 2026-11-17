import { describe, expect, it } from "vitest";
import { csvCell, fingerprintRow, transactionsToCsv, validateCsvText } from "@/lib/csv";

describe("CSV import and export", () => {
  const csv = `\uFEFFArt;Konto;Bezeichnung;Datum;Einnahmen;Ausgaben\r
Nutzungseinnahme;8200;Lizenz;15.01.2026;1.200,00;\r
Bürobedarf;4930;Papier;03.02.2026;;12,50\r
`;

  it("parses UTF-8 BOM and German amounts", () => {
    const result = validateCsvText(csv);
    expect(result.headersOk).toBe(true);
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0]?.incomeCents).toBe(120000);
    expect(result.valid[0]?.category).toBe("");
    expect(result.valid[1]?.expenseCents).toBe(1250);
  });

  it("accepts an optional invoice number and an empty income category", () => {
    const result = validateCsvText(
      "Art;Konto;Bezeichnung;Datum;Einnahmen;Ausgaben;Rechnungsnummer\n;8400;Honorar;15.01.2026;10,00;;RE-9\n",
    );
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0]?.invoiceNumber).toBe("RE-9");
    expect(result.valid[0]?.category).toBe("");
  });

  it("reports row-specific errors and rejects invalid categories", () => {
    const result = validateCsvText(
      "Art;Konto;Bezeichnung;Datum;Einnahmen;Ausgaben\nSteuer;1;X;15.01.2026;10,00;\n",
    );
    expect(result.valid).toHaveLength(0);
    expect(result.rows[0]?.error).toMatch(/Kategorie/i);
  });

  it("exports semicolon CSV with BOM and German dates", () => {
    const out = transactionsToCsv([
      {
        category: "Bürobedarf",
        account: "4930",
        description: "Papier; extra",
        date: "2026-02-03",
        incomeCents: 0,
        expenseCents: 1250,
      },
    ]);
    expect(out.startsWith("\uFEFF")).toBe(true);
    expect(out).toContain(
      "Art;Konto;Bezeichnung;Datum;Einnahmen;Ausgaben;Rechnungsnummer",
    );
    expect(out).toContain("03.02.2026");
    expect(out).toContain("12,50");
    expect(out).toContain('"Papier; extra"');
  });

  it("neutralizes spreadsheet formula injection", () => {
    expect(csvCell("=CMD()")).toBe("'=CMD()");
    expect(csvCell("+1+1")).toBe("'+1+1");
    expect(csvCell("-2+3")).toBe("'-2+3");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
  });

  it("builds a stable duplicate fingerprint", () => {
    const row = {
      category: "Bürobedarf" as const,
      account: "4930",
      description: "Papier",
      date: "2026-02-03",
      incomeCents: 0,
      expenseCents: 1250,
    };
    expect(fingerprintRow(row)).toBe(fingerprintRow({ ...row }));
  });
});
