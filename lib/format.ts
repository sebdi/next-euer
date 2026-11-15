const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const datum = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function formatEuro(cent: number): string {
  return eur.format(cent / 100);
}

/** Mit Vorzeichen: +1.200,00 € / −45,90 € */
export function formatEuroSigned(cent: number): string {
  if (cent === 0) return eur.format(0);
  const sign = cent > 0 ? "+" : "−";
  return sign + eur.format(Math.abs(cent) / 100);
}

export function formatDatum(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : datum.format(d);
}

/** Cent → "1234,56" für Eingabefelder */
export function centToInput(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",");
}

/** Liest deutsche Betragseingaben ("1.234,56", "12,5", "12.50") in Cent. */
export function parseBetrag(raw: string): number | null {
  let s = raw.replace(/[\s€]/g, "");
  if (!s) return null;
  if (s.includes(",")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cent = Math.round(Number(s) * 100);
  return Number.isFinite(cent) ? cent : null;
}

export function heuteIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${t}`;
}
