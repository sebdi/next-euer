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
import {
  buchungInputSchema,
  fieldErrorsFromZod,
  transactionIdSchema,
  USER_ERROR,
} from "@/lib/validation";
import type { Buchung, BuchungInput } from "@/lib/types";

async function parseInput(input: BuchungInput) {
  return buchungInputSchema.safeParse(input);
}

export async function createBuchungAction(
  input: BuchungInput,
): Promise<ActionResult<Buchung>> {
  const user = await getAuthorizedUser();
  if (!user) return actionError(USER_ERROR.unauthorized);
  const parsed = await parseInput(input);
  if (!parsed.success) {
    return actionError(USER_ERROR.validation, fieldErrorsFromZod(parsed.error));
  }
  try {
    const data = await createTransaction(parsed.data);
    revalidatePath("/");
    return { ok: true, data };
  } catch {
    return actionError(USER_ERROR.generic);
  }
}

export async function updateBuchungAction(
  id: string,
  input: BuchungInput,
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
    const data = await updateTransaction(idParsed.data, parsed.data);
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
