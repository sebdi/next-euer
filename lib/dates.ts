const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DE_DATE = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

export function isValidIsoDate(iso: string): boolean {
  const match = ISO_DATE.exec(iso);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  const d = new Date(utc);
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
}

/** Calendar year bounds as UTC dates (inclusive start, exclusive end). */
export function yearDateRange(year: number): { gte: Date; lt: Date } {
  return {
    gte: new Date(Date.UTC(year, 0, 1)),
    lt: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

export function isoDateToUtc(iso: string): Date {
  if (!isValidIsoDate(iso)) {
    throw new Error("Invalid date.");
  }
  return new Date(`${iso}T00:00:00.000Z`);
}

export function utcDateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseFlexibleDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (ISO_DATE.test(trimmed)) {
    return isValidIsoDate(trimmed) ? trimmed : null;
  }
  const de = DE_DATE.exec(trimmed);
  if (!de) return null;
  const day = de[1].padStart(2, "0");
  const month = de[2].padStart(2, "0");
  const iso = `${de[3]}-${month}-${day}`;
  return isValidIsoDate(iso) ? iso : null;
}

export function isoToGermanDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function parseYearParam(raw: string | undefined | null): number {
  if (!raw || !/^\d{4}$/.test(raw)) return currentYear();
  const year = Number(raw);
  if (year < 1990 || year > 2100) return currentYear();
  return year;
}
