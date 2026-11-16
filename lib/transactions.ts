import type { Prisma } from "@prisma/client";
import { getPrisma } from "./prisma";
import { defaultAccountForCategory } from "./categories";
import { isoDateToUtc, utcDateToIso, yearDateRange } from "./dates";
import {
  bewirtungAbziehbarCents,
  bigintToCents,
  centsToBigInt,
  profitCents,
} from "./money";
import type { Buchung, BuchungInput, YearTotals } from "./types";
import type { CsvRowParsed } from "./validation";
import { fingerprintRow } from "./csv";

export function toBuchung(row: {
  id: string;
  category: string;
  account: string;
  description: string;
  date: Date;
  incomeCents: bigint;
  expenseCents: bigint;
  grossCents?: bigint | null;
}): Buchung {
  const income = bigintToCents(row.incomeCents);
  const expense = bigintToCents(row.expenseCents);
  const einnahme = income > 0;
  const brutto =
    row.grossCents == null ? undefined : bigintToCents(row.grossCents);
  return {
    id: row.id,
    typ: einnahme ? "einnahme" : "ausgabe",
    kategorieId: row.category,
    konto: row.account,
    bezeichnung: row.description,
    datum: utcDateToIso(row.date),
    betragCent: einnahme ? income : expense,
    bruttoCent: brutto,
  };
}

export function inputToDb(input: BuchungInput) {
  const bewirtung =
    input.kategorieId === "Bewirtungskosten" &&
    input.typ === "ausgabe" &&
    input.bruttoCent != null;
  const incomeCents = !bewirtung && input.typ === "einnahme" ? input.betragCent : 0;
  const expenseCents = bewirtung
    ? bewirtungAbziehbarCents(input.bruttoCent!)
    : input.typ === "ausgabe"
      ? input.betragCent
      : 0;
  return {
    category: input.kategorieId,
    account: input.konto.trim() || defaultAccountForCategory(input.kategorieId),
    description: input.bezeichnung.trim(),
    date: isoDateToUtc(input.datum),
    incomeCents: centsToBigInt(incomeCents),
    expenseCents: centsToBigInt(expenseCents),
    grossCents: bewirtung ? centsToBigInt(input.bruttoCent!) : null,
  };
}

export async function listYears(): Promise<number[]> {
  const current = new Date().getFullYear();
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<Array<{ year: number }>>`
    SELECT DISTINCT EXTRACT(YEAR FROM date)::int AS year
    FROM transactions
    ORDER BY year DESC
  `;
  const set = new Set<number>([current]);
  for (const row of rows) set.add(row.year);
  return [...set].sort((a, b) => b - a);
}

export async function listTransactionsForYear(year: number): Promise<Buchung[]> {
  const prisma = getPrisma();
  const range = yearDateRange(year);
  const rows = await prisma.transaction.findMany({
    where: { date: { gte: range.gte, lt: range.lt } },
    orderBy: [{ date: "desc" }, { category: "asc" }, { account: "asc" }],
  });
  return rows.map(toBuchung);
}

export async function totalsForYear(year: number): Promise<YearTotals> {
  const prisma = getPrisma();
  const range = yearDateRange(year);
  const agg = await prisma.transaction.aggregate({
    where: { date: { gte: range.gte, lt: range.lt } },
    _sum: { incomeCents: true, expenseCents: true },
  });
  const incomeCents = bigintToCents(agg._sum.incomeCents ?? 0n);
  const expenseCents = bigintToCents(agg._sum.expenseCents ?? 0n);
  return {
    incomeCents,
    expenseCents,
    profitCents: profitCents(incomeCents, expenseCents),
  };
}

export async function createTransaction(input: BuchungInput): Promise<Buchung> {
  const created = await getPrisma().transaction.create({
    data: inputToDb(input),
  });
  return toBuchung(created);
}

export async function updateTransaction(
  id: string,
  input: BuchungInput,
): Promise<Buchung> {
  const updated = await getPrisma().transaction.update({
    where: { id },
    data: inputToDb(input),
  });
  return toBuchung(updated);
}

export async function deleteTransaction(id: string): Promise<void> {
  await getPrisma().transaction.delete({ where: { id } });
}

export async function getTransaction(id: string): Promise<Buchung | null> {
  const row = await getPrisma().transaction.findUnique({ where: { id } });
  return row ? toBuchung(row) : null;
}

export async function exportRowsForYear(year: number) {
  const prisma = getPrisma();
  const range = yearDateRange(year);
  const rows = await prisma.transaction.findMany({
    where: { date: { gte: range.gte, lt: range.lt } },
    orderBy: [{ date: "asc" }, { category: "asc" }, { account: "asc" }],
  });
  return rows.map((row) => ({
    category: row.category,
    account: row.account,
    description: row.description,
    date: utcDateToIso(row.date),
    incomeCents: bigintToCents(row.incomeCents),
    expenseCents: bigintToCents(row.expenseCents),
  }));
}

export async function importRows(rows: CsvRowParsed[]): Promise<{
  imported: number;
  skipped: number;
}> {
  if (rows.length === 0) return { imported: 0, skipped: 0 };

  return getPrisma().$transaction(async (tx) => {
    const dates = [...new Set(rows.map((r) => r.date))];
    const existing = await tx.transaction.findMany({
      where: {
        date: { in: dates.map((d) => isoDateToUtc(d)) },
      },
    });
    const seen = new Set(
      existing.map((row) =>
        fingerprintRow({
          category: row.category as CsvRowParsed["category"],
          account: row.account,
          description: row.description,
          date: utcDateToIso(row.date),
          incomeCents: bigintToCents(row.incomeCents),
          expenseCents: bigintToCents(row.expenseCents),
        }),
      ),
    );

    const toCreate: Prisma.TransactionCreateManyInput[] = [];
    let skipped = 0;
    for (const row of rows) {
      const key = fingerprintRow(row);
      if (seen.has(key)) {
        skipped += 1;
        continue;
      }
      seen.add(key);
      toCreate.push({
        category: row.category,
        account: row.account,
        description: row.description,
        date: isoDateToUtc(row.date),
        incomeCents: centsToBigInt(row.incomeCents),
        expenseCents: centsToBigInt(row.expenseCents),
      });
    }
    if (toCreate.length > 0) {
      await tx.transaction.createMany({ data: toCreate });
    }
    return { imported: toCreate.length, skipped };
  });
}
