import { ACCOUNTING_CATEGORIES } from "./categories";
import { isoToGermanDate, parseFlexibleDate } from "./dates";
import { formatCentsGerman, parseBetrag } from "./money";
import { csvRowSchema, type CsvRowParsed } from "./validation";

export const CSV_HEADERS = [
  "Art",
  "Konto",
  "Bezeichnung",
  "Datum",
  "Einnahmen",
  "Ausgaben",
] as const;

export type CsvPreviewRow = {
  line: number;
  data?: CsvRowParsed;
  error?: string;
};

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function csvCell(value: string): string {
  let v = value;
  if (FORMULA_PREFIX.test(v)) v = `'${v}`;
  if (/[";\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ";") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n") {
      if (cell.endsWith("\r")) cell = cell.slice(0, -1);
      row.push(cell);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  if (cell.endsWith("\r")) cell = cell.slice(0, -1);
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }
  return rows;
}

function headerIndex(header: string[]): Record<string, number> | null {
  const normalized = header.map((h) => h.trim());
  const idx: Record<string, number> = {};
  for (const name of CSV_HEADERS) {
    const i = normalized.findIndex((h) => h.toLocaleLowerCase("de") === name.toLocaleLowerCase("de"));
    if (i < 0) return null;
    idx[name] = i;
  }
  return idx;
}

export function validateCsvText(text: string): {
  headersOk: boolean;
  rows: CsvPreviewRow[];
  valid: CsvRowParsed[];
} {
  const table = parseCsv(text);
  if (table.length === 0) {
    return {
      headersOk: false,
      rows: [{ line: 1, error: "Die Datei ist leer." }],
      valid: [],
    };
  }
  const idx = headerIndex(table[0]);
  if (!idx) {
    return {
      headersOk: false,
      rows: [
        {
          line: 1,
          error: `Kopfzeile muss ${CSV_HEADERS.join("; ")} enthalten.`,
        },
      ],
      valid: [],
    };
  }

  const rows: CsvPreviewRow[] = [];
  const valid: CsvRowParsed[] = [];

  table.slice(1).forEach((cols, offset) => {
    const line = offset + 2;
    const get = (name: (typeof CSV_HEADERS)[number]) =>
      (cols[idx[name]] ?? "").trim();

    const date = parseFlexibleDate(get("Datum"));
    const income = parseBetrag(get("Einnahmen") || "0");
    const expense = parseBetrag(get("Ausgaben") || "0");
    const category = get("Art");

    if (income == null) {
      rows.push({ line, error: "Einnahmen sind kein gültiger Betrag." });
      return;
    }
    if (expense == null) {
      rows.push({ line, error: "Ausgaben sind kein gültiger Betrag." });
      return;
    }
    if (!date) {
      rows.push({ line, error: "Datum muss TT.MM.JJJJ sein." });
      return;
    }
    if (!(ACCOUNTING_CATEGORIES as readonly string[]).includes(category)) {
      rows.push({ line, error: "Unbekannte Kategorie." });
      return;
    }

    const parsed = csvRowSchema.safeParse({
      category,
      account: get("Konto"),
      description: get("Bezeichnung"),
      date,
      incomeCents: income,
      expenseCents: expense,
    });
    if (!parsed.success) {
      rows.push({
        line,
        error: parsed.error.issues[0]?.message ?? "Zeile ist ungültig.",
      });
      return;
    }
    rows.push({ line, data: parsed.data });
    valid.push(parsed.data);
  });

  return { headersOk: true, rows, valid };
}

export function transactionsToCsv(
  rows: Array<{
    category: string;
    account: string;
    description: string;
    date: string;
    incomeCents: number;
    expenseCents: number;
  }>,
): string {
  const lines = [
    [...CSV_HEADERS].join(";"),
    ...rows.map((r) =>
      [
        csvCell(r.category),
        csvCell(r.account),
        csvCell(r.description),
        csvCell(isoToGermanDate(r.date)),
        csvCell(r.incomeCents > 0 ? formatCentsGerman(r.incomeCents) : ""),
        csvCell(r.expenseCents > 0 ? formatCentsGerman(r.expenseCents) : ""),
      ].join(";"),
    ),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function fingerprintRow(row: CsvRowParsed): string {
  return [
    row.date,
    row.category,
    row.account,
    row.description,
    String(row.incomeCents),
    String(row.expenseCents),
  ].join("\u001f");
}
