import type { Kategorie } from "./types";

/**
 * Buchungskategorien.
 * Die Kontonummern sind Platzhalter (an SKR03 angelehnt) und müssen
 * mit dem tatsächlich verwendeten Kontenrahmen abgeglichen werden.
 */
export const KATEGORIEN: Kategorie[] = [
  { id: "abschreibungen", name: "Abschreibungen", konto: "4830", typ: "ausgabe" },
  { id: "bewirtungskosten", name: "Bewirtungskosten", konto: "4650", typ: "ausgabe" },
  { id: "buerobedarf", name: "Bürobedarf", konto: "4930", typ: "ausgabe" },
  { id: "fahrtkosten", name: "Fahrtkosten", konto: "4673", typ: "ausgabe" },
  { id: "fortbildungen", name: "Fortbildungen", konto: "4945", typ: "ausgabe" },
  { id: "homeoffice", name: "Homeoffice", konto: "4288", typ: "ausgabe" },
  { id: "internet-telefon", name: "Internet und Telefon", konto: "4920", typ: "ausgabe" },
  { id: "edv", name: "Laufende EDV Kosten", konto: "4964", typ: "ausgabe" },
  { id: "nutzungseinnahme", name: "Nutzungseinnahme", konto: "8200", typ: "einnahme" },
  { id: "oeffentliche", name: "Öffentliche und andere", konto: "4676", typ: "ausgabe" },
  { id: "uebernachtung", name: "Übernachtungskosten", konto: "4666", typ: "ausgabe" },
  { id: "verpflegung", name: "Verpflegung", konto: "4664", typ: "ausgabe" },
];

const byId = new Map(KATEGORIEN.map((k) => [k.id, k]));

export function getKategorie(id: string): Kategorie | undefined {
  return byId.get(id);
}
