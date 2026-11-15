import type { Buchung } from "./types";

/** Beispieldaten für die Demo — ersetzt später die echte Datenquelle. */
export const BEISPIEL_BUCHUNGEN: Buchung[] = [
  { id: "b01", typ: "einnahme", kategorieId: "nutzungseinnahme", bezeichnung: "Lizenzabrechnung Q1", datum: "2026-01-15", betragCent: 420000 },
  { id: "b02", typ: "ausgabe", kategorieId: "edv", bezeichnung: "Hosting Januar", datum: "2026-01-20", betragCent: 2000 },
  { id: "b03", typ: "ausgabe", kategorieId: "internet-telefon", bezeichnung: "Glasfaseranschluss Januar", datum: "2026-01-28", betragCent: 4499 },
  { id: "b04", typ: "ausgabe", kategorieId: "buerobedarf", bezeichnung: "Druckerpapier und Toner", datum: "2026-02-03", betragCent: 6790 },
  { id: "b05", typ: "ausgabe", kategorieId: "fortbildungen", bezeichnung: "Online-Kurs TypeScript", datum: "2026-02-17", betragCent: 24900 },
  { id: "b06", typ: "ausgabe", kategorieId: "fahrtkosten", bezeichnung: "Kundentermin Stuttgart, 84 km", datum: "2026-03-05", betragCent: 2520 },
  { id: "b07", typ: "ausgabe", kategorieId: "bewirtungskosten", bezeichnung: "Geschäftsessen Projektstart", datum: "2026-03-05", betragCent: 8640 },
  { id: "b08", typ: "einnahme", kategorieId: "nutzungseinnahme", bezeichnung: "Lizenzabrechnung Q2", datum: "2026-04-15", betragCent: 465000 },
  { id: "b09", typ: "ausgabe", kategorieId: "oeffentliche", bezeichnung: "Bahnfahrt München und zurück", datum: "2026-05-11", betragCent: 11980 },
  { id: "b10", typ: "ausgabe", kategorieId: "uebernachtung", bezeichnung: "Hotel München, 2 Nächte", datum: "2026-05-11", betragCent: 23800 },
  { id: "b11", typ: "ausgabe", kategorieId: "verpflegung", bezeichnung: "Verpflegungspauschale München", datum: "2026-05-13", betragCent: 5600 },
  { id: "b12", typ: "ausgabe", kategorieId: "edv", bezeichnung: "Domainverlängerungen", datum: "2026-06-02", betragCent: 3588 },
  { id: "b13", typ: "einnahme", kategorieId: "nutzungseinnahme", bezeichnung: "Lizenzabrechnung Q3", datum: "2026-07-15", betragCent: 512000 },
  { id: "b14", typ: "ausgabe", kategorieId: "buerobedarf", bezeichnung: "Monitorarm", datum: "2026-08-21", betragCent: 8999 },
  { id: "b15", typ: "ausgabe", kategorieId: "homeoffice", bezeichnung: "Homeoffice-Pauschale", datum: "2026-09-30", betragCent: 126000 },
  { id: "b16", typ: "ausgabe", kategorieId: "abschreibungen", bezeichnung: "AfA Notebook", datum: "2026-10-31", betragCent: 61633 },
  { id: "a01", typ: "einnahme", kategorieId: "nutzungseinnahme", bezeichnung: "Lizenzabrechnung Q4", datum: "2025-10-15", betragCent: 398000 },
  { id: "a02", typ: "ausgabe", kategorieId: "edv", bezeichnung: "Softwarelizenzen Jahresabo", datum: "2025-11-04", betragCent: 34800 },
  { id: "a03", typ: "ausgabe", kategorieId: "abschreibungen", bezeichnung: "AfA Notebook", datum: "2025-12-31", betragCent: 61633 },
];
