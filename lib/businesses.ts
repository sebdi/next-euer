import { getPrisma } from "./prisma";
import type { Betrieb, BetriebArt } from "./types";
import { DEFAULT_BETRIEB_NAME } from "./business-meta";

export * from "./business-meta";

function toBetrieb(row: {
  id: string;
  name: string;
  kind: string;
  _count?: { transactions: number };
}): Betrieb {
  return {
    id: row.id,
    name: row.name,
    art: row.kind === "gewerblich" ? "gewerblich" : "freiberuflich",
    anzahlBuchungen: row._count?.transactions ?? 0,
  };
}

/** Alle Betriebe in Anlagereihenfolge. Legt einen Standardbetrieb an, falls keiner existiert. */
export async function listBusinesses(): Promise<Betrieb[]> {
  const prisma = getPrisma();
  const rows = await prisma.business.findMany({
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
    include: { _count: { select: { transactions: true } } },
  });
  if (rows.length > 0) return rows.map(toBetrieb);
  const created = await prisma.business.create({
    data: { name: DEFAULT_BETRIEB_NAME, kind: "freiberuflich" },
  });
  return [toBetrieb(created)];
}

/**
 * Wählt den aktiven Betrieb: zuerst aus der URL, dann aus dem Cookie,
 * sonst den ersten.
 */
export function resolveBusiness(
  betriebe: Betrieb[],
  ...candidates: Array<string | null | undefined>
): Betrieb {
  for (const id of candidates) {
    const match = id ? betriebe.find((b) => b.id === id) : undefined;
    if (match) return match;
  }
  return betriebe[0];
}

export async function businessExists(id: string): Promise<boolean> {
  const row = await getPrisma().business.findUnique({
    where: { id },
    select: { id: true },
  });
  return row !== null;
}

export async function createBusiness(input: {
  name: string;
  art: BetriebArt;
}): Promise<Betrieb> {
  const row = await getPrisma().business.create({
    data: { name: input.name, kind: input.art },
  });
  return toBetrieb(row);
}

export async function updateBusiness(
  id: string,
  input: { name: string; art: BetriebArt },
): Promise<Betrieb> {
  const row = await getPrisma().business.update({
    where: { id },
    data: { name: input.name, kind: input.art },
  });
  return toBetrieb(row);
}

export type DeleteBusinessResult =
  | { ok: true }
  | { ok: false; reason: "notFound" | "hasTransactions" | "last" };

/** Löscht nur leere Betriebe und nie den letzten. */
export async function deleteBusiness(id: string): Promise<DeleteBusinessResult> {
  return getPrisma().$transaction(async (tx) => {
    const existing = await tx.business.findUnique({
      where: { id },
      select: { id: true, _count: { select: { transactions: true } } },
    });
    if (!existing) return { ok: false, reason: "notFound" };
    if (existing._count.transactions > 0) {
      return { ok: false, reason: "hasTransactions" };
    }
    if ((await tx.business.count()) <= 1) return { ok: false, reason: "last" };
    await tx.business.delete({ where: { id } });
    return { ok: true };
  });
}
