import { z } from "zod";
import { ACCOUNTING_CATEGORIES } from "./categories";
import { parseCsv, type CsvPreviewRow } from "./csv";
import { parseFlexibleDate } from "./dates";
import { parseBetrag, parseSignedBetrag } from "./money";
import { csvRowSchema, type CsvRowParsed } from "./validation";

export const IMPORT_FIELDS = [
  { id: "description", label: "Bezeichnung", required: true },
  { id: "date", label: "Datum", required: true },
  { id: "income", label: "Einnahmen", required: false },
  { id: "expense", label: "Ausgaben", required: false },
  { id: "amount", label: "Betrag", required: false },
  { id: "category", label: "Art", required: false },
  { id: "account", label: "Konto", required: false },
  { id: "invoiceNumber", label: "Rechnungsnummer", required: false },
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number]["id"];

export type ImportMapping = Record<ImportField, number | null>;

export type CsvTable = {
  headers: string[];
  rows: string[][];
};

const MAX_COLUMNS = 100;
const MAX_ROWS = 5000;
const LEGACY_INCOME_CATEGORY = "Nutzungseinnahme";

const ALIASES: Record<ImportField, string[]> = {
  description: [
    "bezeichnung",
    "beschreibung",
    "buchungstext",
    "verwendungszweck",
    "description",
    "memo",
    "text",
  ],
  date: [
    "datum",
    "date",
    "buchungsdatum",
    "buchungstag",
    "wertstellung",
    "valuta",
    "abrechnungsdatum",
    "abschlussdatum",
  ],
  income: ["einnahmen", "einnahme", "income", "credit", "haben"],
  expense: ["ausgaben", "ausgabe", "expense", "debit", "soll"],
  amount: ["betrag", "amount", "umsatz"],
  category: ["art", "kategorie", "category"],
  account: ["konto", "account", "kontonummer"],
  invoiceNumber: ["rechnungsnummer", "rechnung", "invoice", "belegnummer", "beleg"],
};

const indexSchema = z.number().int().min(0).max(MAX_COLUMNS - 1).nullable();

export const importMappingSchema = z
  .object({
    description: indexSchema,
    date: indexSchema,
    income: indexSchema,
    expense: indexSchema,
    amount: indexSchema,
    category: indexSchema,
    account: indexSchema,
    invoiceNumber: indexSchema,
  })
  .strict();

export function emptyImportMapping(): ImportMapping {
  return {
    description: null,
    date: null,
    income: null,
    expense: null,
    amount: null,
    category: null,
    account: null,
    invoiceNumber: null,
  };
}

export function detectDelimiter(text: string): "," | ";" | "\t" {
  const sample = text.replace(/^\uFEFF/, "");
  const counts = { ";": 0, ",": 0, "\t": 0 };
  let inQuotes = false;
  for (let i = 0; i < sample.length; i++) {
    const ch = sample[i];
    if (inQuotes) {
      if (ch === '"') {
        if (sample[i + 1] === '"') i += 1;
        else inQuotes = false;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === "\n") break;
    if (ch === ";" || ch === "," || ch === "\t") counts[ch] += 1;
  }
  if (counts[","] > counts[";"] && counts[","] > counts["\t"]) return ",";
  if (counts["\t"] > counts[";"] && counts["\t"] > counts[","]) return "\t";
  return ";";
}

function uniqueHeaders(labels: string[]): string[] {
  const seen = new Map<string, number>();
  return labels.map((label) => {
    const count = (seen.get(label) ?? 0) + 1;
    seen.set(label, count);
    return count === 1 ? label : `${label} (${count})`;
  });
}

export function readCsvTable(
  text: string,
  hasHeader: boolean,
): { table: CsvTable } | { error: string } {
  const parsed = parseCsv(text, detectDelimiter(text));
  if (parsed.length === 0) return { error: "Die Datei ist leer." };
  const width = parsed.reduce((max, row) => Math.max(max, row.length), 0);
  if (width === 0) return { error: "Die Datei ist leer." };
  if (width > MAX_COLUMNS) return { error: "Die Datei hat zu viele Spalten." };

  const data = hasHeader ? parsed.slice(1) : parsed;
  if (data.length === 0) return { error: "Die Datei enthält keine Buchungen." };
  if (data.length > MAX_ROWS) return { error: "Höchstens 5000 Zeilen können importiert werden." };

  const rawHeaders = Array.from({ length: width }, (_, index) => {
    const label = hasHeader ? (parsed[0]?.[index] ?? "").trim() : "";
    return label || `Spalte ${index + 1}`;
  });
  return {
    table: {
      headers: uniqueHeaders(rawHeaders),
      rows: data.map((row) =>
        Array.from({ length: width }, (_, index) => (row[index] ?? "").trim()),
      ),
    },
  };
}

function normHeader(value: string): string {
  return value
    .toLocaleLowerCase("de")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[_\-./]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function guessImportMapping(headers: string[]): ImportMapping {
  const mapping = emptyImportMapping();
  const used = new Set<number>();
  for (const field of IMPORT_FIELDS) {
    const aliases = new Set(ALIASES[field.id]);
    const index = headers.findIndex(
      (header, column) => !used.has(column) && aliases.has(normHeader(header)),
    );
    if (index >= 0) {
      mapping[field.id] = index;
      used.add(index);
    }
  }
  return mapping;
}

export function mappingProblem(mapping: ImportMapping, columnCount: number): string | null {
  if (mapping.description == null) return "Bezeichnung zuordnen.";
  if (mapping.date == null) return "Datum zuordnen.";
  if (mapping.income == null && mapping.expense == null && mapping.amount == null) {
    return "Einnahmen, Ausgaben oder Betrag zuordnen.";
  }
  const used = new Set<number>();
  for (const field of IMPORT_FIELDS) {
    const index = mapping[field.id];
    if (index == null) continue;
    if (index < 0 || index >= columnCount) return "Eine zugeordnete Spalte gibt es nicht.";
    if (used.has(index)) return "Jede Spalte nur einmal zuordnen.";
    used.add(index);
  }
  return null;
}

function cell(row: string[], index: number | null): string | null {
  if (index == null) return null;
  return row[index] ?? "";
}

export function buildCsvRow(input: {
  line: number;
  description: string;
  dateRaw: string;
  incomeRaw: string | null;
  expenseRaw: string | null;
  amountRaw: string | null;
  categoryRaw: string;
  accountRaw: string;
  invoiceRaw: string;
}): CsvPreviewRow {
  const date = parseFlexibleDate(input.dateRaw);
  if (!date) return { line: input.line, error: "Datum ist ungültig." };

  let income = 0;
  let expense = 0;
  const incomeText = input.incomeRaw?.trim() ?? "";
  const expenseText = input.expenseRaw?.trim() ?? "";
  const amountText = input.amountRaw?.trim() ?? "";
  if (incomeText || expenseText) {
    if (incomeText) {
      const parsed = parseBetrag(incomeText);
      if (parsed == null) return { line: input.line, error: "Einnahmen sind kein gültiger Betrag." };
      income = parsed;
    }
    if (expenseText) {
      const parsed = parseBetrag(expenseText);
      if (parsed == null) return { line: input.line, error: "Ausgaben sind kein gültiger Betrag." };
      expense = parsed;
    }
  } else if (input.amountRaw != null && amountText) {
    const signed = parseSignedBetrag(amountText);
    if (signed == null) return { line: input.line, error: "Betrag ist ungültig." };
    if (signed > 0) income = signed;
    else if (signed < 0) expense = -signed;
    else return { line: input.line, error: "Betrag muss größer als 0 sein." };
  } else {
    return { line: input.line, error: "Betrag fehlt." };
  }

  let category = input.categoryRaw.trim();
  let invoiceNumber = input.invoiceRaw.trim();
  if (income > 0 && expense === 0) {
    if (category !== "" && category !== LEGACY_INCOME_CATEGORY) {
      return { line: input.line, error: "Einnahmen haben keine Kategorie." };
    }
    category = "";
  } else if (expense > 0 && income === 0) {
    if (category !== "" && !(ACCOUNTING_CATEGORIES as readonly string[]).includes(category)) {
      return { line: input.line, error: "Unbekannte Kategorie." };
    }
    invoiceNumber = "";
  }
  if (invoiceNumber.length > 64) {
    return { line: input.line, error: "Rechnungsnummer ist zu lang." };
  }

  const parsed = csvRowSchema.safeParse({
    category,
    account: input.accountRaw.trim(),
    description: input.description,
    date,
    incomeCents: income,
    expenseCents: expense,
    invoiceNumber,
  });
  if (!parsed.success) {
    return {
      line: input.line,
      error: parsed.error.issues[0]?.message ?? "Zeile ist ungültig.",
    };
  }
  return { line: input.line, data: parsed.data };
}

export function mapCsvTable(
  table: CsvTable,
  mapping: ImportMapping,
  hasHeader: boolean,
): { rows: CsvPreviewRow[]; valid: CsvRowParsed[] } {
  const rows: CsvPreviewRow[] = [];
  const valid: CsvRowParsed[] = [];
  table.rows.forEach((row, offset) => {
    const line = offset + (hasHeader ? 2 : 1);
    const built = buildCsvRow({
      line,
      description: cell(row, mapping.description) ?? "",
      dateRaw: cell(row, mapping.date) ?? "",
      incomeRaw: cell(row, mapping.income),
      expenseRaw: cell(row, mapping.expense),
      amountRaw: cell(row, mapping.amount),
      categoryRaw: cell(row, mapping.category) ?? "",
      accountRaw: cell(row, mapping.account) ?? "",
      invoiceRaw: cell(row, mapping.invoiceNumber) ?? "",
    });
    rows.push(built);
    if (built.data) valid.push(built.data);
  });
  return { rows, valid };
}

export function sampleCell(table: CsvTable, index: number): string {
  for (const row of table.rows.slice(0, 8)) {
    const value = row[index]?.trim();
    if (value) return value.length > 48 ? `${value.slice(0, 48)}…` : value;
  }
  return "";
}
