export type BuchungTyp = "einnahme" | "ausgabe";

export interface Kategorie {
  id: string;
  name: string;
  /** Kontonummer, wird in Geist Mono dargestellt */
  konto: string;
  /** Vorbelegung für den Typ einer neuen Buchung */
  typ: BuchungTyp;
}

export interface Buchung {
  id: string;
  typ: BuchungTyp;
  kategorieId: string;
  konto: string;
  bezeichnung: string;
  /** ISO-Datum, JJJJ-MM-TT */
  datum: string;
  /** Betrag in Cent, immer positiv */
  betragCent: number;
}

export type BuchungInput = Omit<Buchung, "id">;

export interface YearTotals {
  incomeCents: number;
  expenseCents: number;
  profitCents: number;
}

export type AppUser = {
  name: string;
  login: string;
  avatarUrl?: string;
};
