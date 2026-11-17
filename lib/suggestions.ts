import type { BuchungTyp } from "./types";

const MAX_VALUES = 100;
const SUGGESTION_LIMIT = 6;

export type RepeatedBooking = {
  typ: BuchungTyp;
  bezeichnung: string;
  konto: string;
  kategorieId: string;
  rechnungsnummer: string;
};

export type EntrySuggestions = {
  bookings: RepeatedBooking[];
  expenseAccounts: string[];
  incomeAccounts: string[];
  invoices: string[];
  origins: string[];
  destinations: string[];
};

export const emptyEntrySuggestions: EntrySuggestions = {
  bookings: [],
  expenseAccounts: [],
  incomeAccounts: [],
  invoices: [],
  origins: [],
  destinations: [],
};

type SuggestionSource = {
  typ: BuchungTyp;
  bezeichnung: string;
  konto: string;
  kategorieId: string;
  rechnungsnummer?: string;
  routeOrigin?: string;
  routeDestination?: string;
};

function remember(list: string[], seen: Set<string>, value: string | undefined) {
  const text = value?.trim() ?? "";
  if (!text || list.length >= MAX_VALUES) return;
  const key = text.toLocaleLowerCase("de");
  if (seen.has(key)) return;
  seen.add(key);
  list.push(text);
}

/** Newest rows win. Pass them newest first. */
export function collectEntrySuggestions(rows: SuggestionSource[]): EntrySuggestions {
  const bookings: RepeatedBooking[] = [];
  const bookingKeys = new Set<string>();
  const expenseAccounts: string[] = [];
  const incomeAccounts: string[] = [];
  const invoices: string[] = [];
  const origins: string[] = [];
  const destinations: string[] = [];
  const expenseAccountKeys = new Set<string>();
  const incomeAccountKeys = new Set<string>();
  const invoiceKeys = new Set<string>();
  const originKeys = new Set<string>();
  const destinationKeys = new Set<string>();

  for (const row of rows) {
    const bezeichnung = row.bezeichnung.trim();
    if (bezeichnung && bookings.length < MAX_VALUES) {
      const key = `${row.typ}\u001f${bezeichnung.toLocaleLowerCase("de")}`;
      if (!bookingKeys.has(key)) {
        bookingKeys.add(key);
        bookings.push({
          typ: row.typ,
          bezeichnung,
          konto: row.konto.trim(),
          kategorieId: row.typ === "einnahme" ? "" : row.kategorieId.trim(),
          rechnungsnummer: row.rechnungsnummer?.trim() ?? "",
        });
      }
    }
    if (row.typ === "einnahme") {
      remember(incomeAccounts, incomeAccountKeys, row.konto);
      remember(invoices, invoiceKeys, row.rechnungsnummer);
    } else {
      remember(expenseAccounts, expenseAccountKeys, row.konto);
    }
    remember(origins, originKeys, row.routeOrigin);
    remember(destinations, destinationKeys, row.routeDestination);
  }

  return {
    bookings,
    expenseAccounts,
    incomeAccounts,
    invoices,
    origins,
    destinations,
  };
}

/** Texts already used that contain the query, prefix matches first. */
export function filterTexts(values: string[], query: string, limit = SUGGESTION_LIMIT): string[] {
  const q = query.trim().toLocaleLowerCase("de");
  if (!q) return [];
  const seen = new Set<string>();
  const prefix: string[] = [];
  const contains: string[] = [];
  for (const value of values) {
    const text = value.trim();
    const key = text.toLocaleLowerCase("de");
    if (!text || key === q || seen.has(key)) continue;
    if (!key.includes(q)) continue;
    seen.add(key);
    if (key.startsWith(q)) prefix.push(text);
    else contains.push(text);
  }
  return [...prefix, ...contains].slice(0, limit);
}
