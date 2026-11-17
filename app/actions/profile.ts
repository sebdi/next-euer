"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedUser } from "@/lib/auth/session";
import { actionError, type ActionResult } from "@/lib/action-result";
import { saveUserProfile, type UserProfile } from "@/lib/profile";
import { parseTaxRateInput } from "@/lib/tax";
import {
  fieldErrorsFromZod,
  profileSettingsSchema,
  USER_ERROR,
} from "@/lib/validation";

export async function saveProfileAction(input: {
  address: string;
  taxRate: string;
}): Promise<ActionResult<UserProfile>> {
  const user = await getAuthorizedUser();
  if (!user) return actionError(USER_ERROR.unauthorized);

  const parsed = profileSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(USER_ERROR.validation, fieldErrorsFromZod(parsed.error));
  }

  const rate = parseTaxRateInput(parsed.data.taxRate);
  if (rate === "invalid") {
    return actionError(USER_ERROR.validation, {
      taxRate: "Grenzsteuersatz wie 42 oder 42,50 eingeben.",
    });
  }

  try {
    const profile = await saveUserProfile(user.githubId, {
      homeAddress: parsed.data.address.length === 0 ? null : parsed.data.address,
      marginalTaxRateBps: rate,
    });
    revalidatePath("/");
    revalidatePath("/profil");
    return { ok: true, data: profile };
  } catch {
    return actionError(USER_ERROR.generic);
  }
}
