"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedUser } from "@/lib/auth/session";
import { actionError, type ActionResult } from "@/lib/action-result";
import { validateCsvText } from "@/lib/csv";
import { importRows } from "@/lib/transactions";
import { USER_ERROR } from "@/lib/validation";

const MAX_IMPORT_BYTES = 1_000_000;

export async function importCsvAction(
  formData: FormData,
): Promise<ActionResult<{ imported: number; skipped: number }>> {
  const user = await getAuthorizedUser();
  if (!user) return actionError(USER_ERROR.unauthorized);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return actionError("Bitte eine CSV-Datei wählen.");
  }
  if (file.size > MAX_IMPORT_BYTES) {
    return actionError("Die Datei ist zu groß (höchstens 1 MB).");
  }
  const name = file.name.toLowerCase();
  if (!name.endsWith(".csv") && file.type && !file.type.includes("csv") && file.type !== "text/plain") {
    return actionError("Nur CSV-Dateien können importiert werden.");
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return actionError("Die Datei konnte nicht gelesen werden.");
  }

  const preview = validateCsvText(text);
  if (!preview.headersOk) {
    return actionError(preview.rows[0]?.error ?? USER_ERROR.importInvalid);
  }
  const invalid = preview.rows.filter((r) => r.error);
  if (invalid.length > 0) {
    return actionError(
      `${invalid.length} ${invalid.length === 1 ? "Zeile ist" : "Zeilen sind"} ungültig. Import abgebrochen.`,
    );
  }
  if (preview.valid.length === 0) {
    return actionError("Die Datei enthält keine Buchungen.");
  }

  try {
    const data = await importRows(preview.valid);
    revalidatePath("/");
    return { ok: true, data };
  } catch {
    return actionError(USER_ERROR.generic);
  }
}
