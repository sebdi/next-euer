import { getKategorie } from "./categories";
import type { Buchung } from "./types";

function cell(value: string): string {
  return /[";\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function betrag(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",");
}

/** CSV mit Semikolon und BOM, damit Excel Umlaute und Beträge korrekt liest. */
export function buchungenToCsv(buchungen: Buchung[]): string {
  const rows = [
    ["Art", "Konto", "Bezeichnung", "Datum", "Einnahmen", "Ausgaben"],
    ...buchungen.map((b) => {
      const k = getKategorie(b.kategorieId);
      return [
        k?.name ?? "",
        k?.konto ?? "",
        b.bezeichnung,
        b.datum.split("-").reverse().join("."),
        b.typ === "einnahme" ? betrag(b.betragCent) : "",
        b.typ === "ausgabe" ? betrag(b.betragCent) : "",
      ];
    }),
  ];
  return "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
