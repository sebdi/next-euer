import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ProfileScreen } from "@/components/profile/profile-screen";
import { requireUser } from "@/lib/auth/session";
import { BETRIEB_COOKIE, listBusinesses, resolveBusiness } from "@/lib/businesses";
import { parseYearParam } from "@/lib/dates";
import { getUserProfile } from "@/lib/profile";
import { listYears, totalsForYear } from "@/lib/transactions";
import type { Betrieb } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil – NextEÜR",
  description: "Profil, Wohnadresse und erwartete Steuer",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ jahr?: string; betrieb?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const jahr = parseYearParam(params.jahr);
  const cookieStore = await cookies();

  let jahre = [jahr];
  let totals = { incomeCents: 0, expenseCents: 0, profitCents: 0 };
  let loadError: string | null = null;
  let homeAddress: string | null = null;
  let marginalTaxRateBps: number | null = null;
  let anzahlBetriebe = 1;
  let betriebe: Betrieb[] = [];
  let betrieb: Betrieb | null = null;

  try {
    const profile = await getUserProfile(user.githubId);
    homeAddress = profile.homeAddress;
    marginalTaxRateBps = profile.marginalTaxRateBps;
  } catch {
    homeAddress = null;
    marginalTaxRateBps = null;
  }

  try {
    // Die Einkommensteuer betrifft die Person, daher zählen alle Betriebe.
    const [years, sums, loaded] = await Promise.all([
      listYears(),
      totalsForYear(jahr),
      listBusinesses(),
    ]);
    jahre = years;
    totals = sums;
    betriebe = loaded;
    betrieb = resolveBusiness(
      loaded,
      params.betrieb,
      cookieStore.get(BETRIEB_COOKIE)?.value,
    );
    anzahlBetriebe = loaded.length;
  } catch {
    loadError = "Die EÜR konnte nicht geladen werden.";
  }

  if (!jahre.includes(jahr)) {
    jahre = [jahr, ...jahre].sort((a, b) => b - a);
  }

  return (
    <ProfileScreen
      user={{
        name: user.name,
        login: user.login,
        avatarUrl: user.avatarUrl,
      }}
      jahr={jahr}
      jahre={jahre}
      totals={totals}
      homeAddress={homeAddress}
      marginalTaxRateBps={marginalTaxRateBps}
      loadError={loadError}
      anzahlBetriebe={anzahlBetriebe}
      betrieb={betrieb}
      betriebe={betriebe}
    />
  );
}
