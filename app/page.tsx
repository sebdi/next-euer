import { cookies } from "next/headers";
import { BuchungenApp } from "@/components/buchungen/buchungen-app";
import { requireUser } from "@/lib/auth/session";
import {
  BETRIEB_COOKIE,
  listBusinesses,
  resolveBusiness,
} from "@/lib/businesses";
import { parseYearParam } from "@/lib/dates";
import { getHomeAddress } from "@/lib/profile";
import { emptyEntrySuggestions, type EntrySuggestions } from "@/lib/suggestions";
import {
  listEntrySuggestions,
  listTransactionsForYear,
  listYears,
  totalsForYear,
} from "@/lib/transactions";
import type { Betrieb } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ jahr?: string; betrieb?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const jahr = parseYearParam(params.jahr);
  const cookieStore = await cookies();

  let buchungen: Awaited<ReturnType<typeof listTransactionsForYear>> = [];
  let jahre = [jahr];
  let totals = { incomeCents: 0, expenseCents: 0, profitCents: 0 };
  let loadError: string | null = null;
  let homeAddress: string | null = null;
  let suggestions: EntrySuggestions = emptyEntrySuggestions;
  let betriebe: Betrieb[] = [];
  let betrieb: Betrieb | null = null;

  try {
    homeAddress = await getHomeAddress(user.githubId);
  } catch {
    homeAddress = null;
  }

  try {
    betriebe = await listBusinesses();
    betrieb = resolveBusiness(
      betriebe,
      params.betrieb,
      cookieStore.get(BETRIEB_COOKIE)?.value,
    );
    [buchungen, jahre, totals, suggestions] = await Promise.all([
      listTransactionsForYear(betrieb.id, jahr),
      listYears(betrieb.id),
      totalsForYear(jahr, betrieb.id),
      listEntrySuggestions(),
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
      betrieb={betrieb}
      betriebe={betriebe}
      buchungen={buchungen}
      totals={totals}
      loadError={loadError}
      homeAddress={homeAddress}
      suggestions={suggestions}
    />
  );
}
