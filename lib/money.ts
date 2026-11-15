/** Integer-cent arithmetic. Never use floating point for stored money. */

export function profitCents(
  totalIncomeCents: number,
  totalExpenseCents: number,
): number {
  return totalIncomeCents - totalExpenseCents;
}

export function bigintToCents(value: bigint): number {
  if (
    value > BigInt(Number.MAX_SAFE_INTEGER) ||
    value < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new RangeError("Amount exceeds safe integer range.");
  }
  return Number(value);
}

export function centsToBigInt(cents: number): bigint {
  if (!Number.isInteger(cents) || !Number.isSafeInteger(cents) || cents < 0) {
    throw new RangeError("Invalid cent amount.");
  }
  return BigInt(cents);
}

/**
 * Parses German and plain decimal amount strings into integer cents.
 * Accepts "1.234,56", "1234,56", "1234.56", "12,5", "12", "1.234".
 */
export function parseBetrag(raw: string): number | null {
  const s = raw.replace(/[\s€]/g, "");
  if (!s) return null;

  let integerPart: string;
  let fractionPart = "";

  if (s.includes(",")) {
    const parts = s.split(",");
    if (parts.length !== 2) return null;
    integerPart = parts[0].replace(/\./g, "");
    fractionPart = parts[1];
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    integerPart = s.replace(/\./g, "");
  } else if (/^\d+\.\d{1,2}$/.test(s)) {
    const parts = s.split(".");
    integerPart = parts[0];
    fractionPart = parts[1];
  } else if (/^\d+$/.test(s)) {
    integerPart = s;
  } else {
    return null;
  }

  if (!/^\d+$/.test(integerPart) || integerPart.length === 0) return null;
  if (fractionPart.length > 2) return null;
  if (fractionPart && !/^\d+$/.test(fractionPart)) return null;

  const fraction = fractionPart.padEnd(2, "0");
  try {
    const cents = BigInt(integerPart) * 100n + BigInt(fraction || "0");
    if (cents < 0n) return null;
    return bigintToCents(cents);
  } catch {
    return null;
  }
}

export function formatCentsGerman(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = cents < 0 ? -cents : cents;
  const euros = Math.trunc(abs / 100);
  const rest = abs % 100;
  const grouped = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}${grouped},${String(rest).padStart(2, "0")}`;
}
