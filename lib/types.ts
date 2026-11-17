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
  /** Empty for income and for an expense without a category. */
  kategorieId: string;
  konto: string;
  bezeichnung: string;
  /** Optional invoice number. Only income bookings use one. */
  rechnungsnummer?: string;
  /** ISO-Datum, JJJJ-MM-TT */
  datum: string;
  /** Erfasster Betrag in Cent, immer positiv. Bei Bewirtung die abziehbaren 70 %. */
  betragCent: number;
  /** Bruttobetrag in Cent, nur bei Bewirtungskosten mit 70-%-Ansatz */
  bruttoCent?: number;
  routeOrigin?: string;
  routeDestination?: string;
  distanceMeters?: number;
  rateCentsPerKm?: number;
  /** Hin- und Rückfahrt: die einfache Strecke wird doppelt angesetzt */
  roundTrip?: boolean;
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
