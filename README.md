# NextEÜR

Minimalistische Einnahmen-Überschuss-Rechnung im Vercel-Stil.
Next.js (App Router), Tailwind CSS v4, shadcn/ui-Komponenten, Lucide, Geist Sans/Mono.

## Start

```bash
npm install
npm run dev
```

Dann http://localhost:3000 öffnen.

## Stand

Reines Frontend mit Beispieldaten. Buchungen liegen im `localStorage` des Browsers.

- `lib/store.ts` — einzige Datenschnittstelle der Oberfläche (`useBuchungen`); hier ein Backend anbinden
- `lib/categories.ts` — Kategorien; die Kontonummern sind Platzhalter
- `lib/user.ts` — Platzhalter für den GitHub-Nutzer
- `app/globals.css` — semantische Farbvariablen für Hell und Dunkel
- `components/ui/` — shadcn/ui-Bausteine
- `components/buchungen/` — Tabelle, mobile Liste, Formular, Summen

Beträge werden intern in Cent (Ganzzahlen) geführt.
