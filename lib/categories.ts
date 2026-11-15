import type { BuchungTyp, Kategorie } from "./types";

export const ACCOUNTING_CATEGORIES = [
  "Abschreibungen",
  "Bewirtungskosten",
  "Bürobedarf",
  "Fahrtkosten",
  "Fortbildungen",
  "Homeoffice",
  "Internet und Telefon",
  "Laufende EDV Kosten",
  "Nutzungseinnahme",
  "Öffentliche und andere",
  "Übernachtungskosten",
  "Verpflegung",
] as const;

export type AccountingCategory = (typeof ACCOUNTING_CATEGORIES)[number];

/**
 * Optional default account numbers (SKR-inspired placeholders).
 * Only applied when the user has not entered a Konto value.
 * Do not treat these as a tax chart of accounts.
 */
const DEFAULT_ACCOUNTS: Record<AccountingCategory, string> = {
  Abschreibungen: "4830",
  Bewirtungskosten: "4650",
  Bürobedarf: "4930",
  Fahrtkosten: "4673",
  Fortbildungen: "4945",
  Homeoffice: "4288",
  "Internet und Telefon": "4920",
  "Laufende EDV Kosten": "4964",
  Nutzungseinnahme: "8200",
  "Öffentliche und andere": "4676",
  Übernachtungskosten: "4666",
  Verpflegung: "4664",
};

const INCOME_CATEGORIES = new Set<AccountingCategory>(["Nutzungseinnahme"]);

export const KATEGORIEN: Kategorie[] = ACCOUNTING_CATEGORIES.map((name) => ({
  id: name,
  name,
  konto: DEFAULT_ACCOUNTS[name],
  typ: INCOME_CATEGORIES.has(name) ? "einnahme" : "ausgabe",
}));

const byId = new Map(KATEGORIEN.map((k) => [k.id, k]));

export function getKategorie(id: string): Kategorie | undefined {
  return byId.get(id);
}

export function isAccountingCategory(value: string): value is AccountingCategory {
  return (ACCOUNTING_CATEGORIES as readonly string[]).includes(value);
}

export function defaultTypForCategory(category: string): BuchungTyp {
  return INCOME_CATEGORIES.has(category as AccountingCategory)
    ? "einnahme"
    : "ausgabe";
}

export function defaultAccountForCategory(category: string): string {
  return isAccountingCategory(category) ? DEFAULT_ACCOUNTS[category] : "";
}
