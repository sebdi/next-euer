import { BuchungenApp } from "@/components/buchungen/buchungen-app";
import { requireUser } from "@/lib/auth/session";
import { parseYearParam } from "@/lib/dates";
import {
  listTransactionsForYear,
  listYears,
  totalsForYear,
} from "@/lib/transactions";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ jahr?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const jahr = parseYearParam(params.jahr);

  let buchungen: Awaited<ReturnType<typeof listTransactionsForYear>> = [];
  let jahre = [jahr];
  let totals = { incomeCents: 0, expenseCents: 0, profitCents: 0 };
  let loadError: string | null = null;

  try {
    [buchungen, jahre, totals] = await Promise.all([
      listTransactionsForYear(jahr),
      listYears(),
      totalsForYear(jahr),
    ]);
  } catch {
    loadError = "Buchungen konnten nicht geladen werden.";
  }

  if (!jahre.includes(jahr)) {
    jahre = [jahr, ...jahre].sort((a, b) => b - a);
  }

  return (
    <BuchungenApp
      user={{
        name: user.name,
        login: user.login,
        avatarUrl: user.avatarUrl,
      }}
      jahr={jahr}
      jahre={jahre}
      buchungen={buchungen}
      totals={totals}
      loadError={loadError}
    />
  );
}
