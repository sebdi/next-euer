"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedUser } from "@/lib/auth/session";
import { actionError, type ActionResult } from "@/lib/action-result";
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  updateTransaction,
} from "@/lib/transactions";
import { businessExists } from "@/lib/businesses";
import {
  businessIdSchema,
  buchungInputSchema,
  fieldErrorsFromZod,
  transactionIdSchema,
  USER_ERROR,
} from "@/lib/validation";
import type { Buchung, BuchungInput } from "@/lib/types";

async function parseInput(input: BuchungInput) {
  return buchungInputSchema.safeParse(input);
}

/** Prüft die Betriebs-ID und ob der Betrieb existiert. */
async function checkBusiness(betriebId: string): Promise<string | null> {
  const parsed = businessIdSchema.safeParse(betriebId);
  if (!parsed.success) return null;
  return (await businessExists(parsed.data)) ? parsed.data : null;
}

export async function createBuchungAction(
  betriebId: string,
  input: BuchungInput,
): Promise<ActionResult<Buchung>> {
  const user = await getAuthorizedUser();
  if (!user) return actionError(USER_ERROR.unauthorized);
  const parsed = await parseInput(input);
  if (!parsed.success) {
    return actionError(USER_ERROR.validation, fieldErrorsFromZod(parsed.error));
  }
  try {
    const businessId = await checkBusiness(betriebId);
    if (!businessId) return actionError(USER_ERROR.businessNotFound);
    const data = await createTransaction(businessId, parsed.data);
    revalidatePath("/");
    return { ok: true, data };
  } catch {
    return actionError(USER_ERROR.generic);
  }
}

export async function updateBuchungAction(
  id: string,
  input: BuchungInput,
  /** Zielbetrieb, um die Buchung zu verschieben */
  betriebId?: string,
): Promise<ActionResult<Buchung>> {
  const user = await getAuthorizedUser();
  if (!user) return actionError(USER_ERROR.unauthorized);
  const idParsed = transactionIdSchema.safeParse(id);
  if (!idParsed.success) return actionError(USER_ERROR.notFound);
  const parsed = await parseInput(input);
  if (!parsed.success) {
    return actionError(USER_ERROR.validation, fieldErrorsFromZod(parsed.error));
  }
  try {
    const existing = await getTransaction(idParsed.data);
    if (!existing) return actionError(USER_ERROR.notFound);
    let businessId: string | undefined;
    if (betriebId !== undefined) {
      const checked = await checkBusiness(betriebId);
      if (!checked) return actionError(USER_ERROR.businessNotFound);
      businessId = checked;
    }
    const data = await updateTransaction(idParsed.data, parsed.data, businessId);
    revalidatePath("/");
    return { ok: true, data };
  } catch {
    return actionError(USER_ERROR.generic);
  }
}

export async function deleteBuchungAction(
  id: string,
): Promise<ActionResult> {
  const user = await getAuthorizedUser();
  if (!user) return actionError(USER_ERROR.unauthorized);
  const idParsed = transactionIdSchema.safeParse(id);
  if (!idParsed.success) return actionError(USER_ERROR.notFound);
  try {
    const existing = await getTransaction(idParsed.data);
    if (!existing) return actionError(USER_ERROR.notFound);
    await deleteTransaction(idParsed.data);
    revalidatePath("/");
    return { ok: true };
  } catch {
    return actionError(USER_ERROR.generic);
  }
}
