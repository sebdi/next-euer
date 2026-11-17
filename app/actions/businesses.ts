"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedUser } from "@/lib/auth/session";
import { actionError, type ActionResult } from "@/lib/action-result";
import {
  createBusiness,
  deleteBusiness,
  updateBusiness,
} from "@/lib/businesses";
import type { Betrieb, BetriebArt } from "@/lib/types";
import {
  businessIdSchema,
  businessInputSchema,
  fieldErrorsFromZod,
  USER_ERROR,
} from "@/lib/validation";

type BusinessInput = { name: string; art: BetriebArt };

export async function createBusinessAction(
  input: BusinessInput,
): Promise<ActionResult<Betrieb>> {
  const user = await getAuthorizedUser();
  if (!user) return actionError(USER_ERROR.unauthorized);
  const parsed = businessInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(USER_ERROR.validation, fieldErrorsFromZod(parsed.error));
  }
  try {
    const data = await createBusiness(parsed.data);
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch {
    return actionError(USER_ERROR.generic);
  }
}

export async function updateBusinessAction(
  id: string,
  input: BusinessInput,
): Promise<ActionResult<Betrieb>> {
  const user = await getAuthorizedUser();
  if (!user) return actionError(USER_ERROR.unauthorized);
  const idParsed = businessIdSchema.safeParse(id);
  if (!idParsed.success) return actionError(USER_ERROR.businessNotFound);
  const parsed = businessInputSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(USER_ERROR.validation, fieldErrorsFromZod(parsed.error));
  }
  try {
    const data = await updateBusiness(idParsed.data, parsed.data);
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch {
    return actionError(USER_ERROR.businessNotFound);
  }
}

export async function deleteBusinessAction(id: string): Promise<ActionResult> {
  const user = await getAuthorizedUser();
  if (!user) return actionError(USER_ERROR.unauthorized);
  const idParsed = businessIdSchema.safeParse(id);
  if (!idParsed.success) return actionError(USER_ERROR.businessNotFound);
  try {
    const result = await deleteBusiness(idParsed.data);
    if (!result.ok) {
      return actionError(
        result.reason === "hasTransactions"
          ? "Der Betrieb enthält noch Buchungen."
          : result.reason === "last"
            ? "Der letzte Betrieb kann nicht gelöscht werden."
            : USER_ERROR.businessNotFound,
      );
    }
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return actionError(USER_ERROR.generic);
  }
}
