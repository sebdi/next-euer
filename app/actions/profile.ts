"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedUser } from "@/lib/auth/session";
import { actionError, type ActionResult } from "@/lib/action-result";
import { saveHomeAddress } from "@/lib/profile";
import { fieldErrorsFromZod, homeAddressSchema, USER_ERROR } from "@/lib/validation";

export async function saveHomeAddressAction(
  address: string,
): Promise<ActionResult<{ homeAddress: string | null }>> {
  const user = await getAuthorizedUser();
  if (!user) return actionError(USER_ERROR.unauthorized);

  const parsed = homeAddressSchema.safeParse({ address });
  if (!parsed.success) {
    return actionError(USER_ERROR.validation, fieldErrorsFromZod(parsed.error));
  }

  try {
    const homeAddress = await saveHomeAddress(
      user.githubId,
      parsed.data.address.length === 0 ? null : parsed.data.address,
    );
    revalidatePath("/");
    return { ok: true, data: { homeAddress } };
  } catch {
    return actionError(USER_ERROR.generic);
  }
}
