import type { Metadata } from "next";
import { ProfileScreen } from "@/components/profile/profile-screen";
import { requireUser } from "@/lib/auth/session";
import { parseYearParam } from "@/lib/dates";
import { getUserProfile } from "@/lib/profile";
import { listYears, totalsForYear } from "@/lib/transactions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil – NextEÜR",
  description: "Profil, Wohnadresse und erwartete Steuer",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ jahr?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const jahr = parseYearParam(params.jahr);

  let jahre = [jahr];
  let totals = { incomeCents: 0, expenseCents: 0, profitCents: 0 };
  let loadError: string | null = null;
  let homeAddress: string | null = null;
  let marginalTaxRateBps: number | null = null;

  try {
    const profile = await getUserProfile(user.githubId);
    homeAddress = profile.homeAddress;
    marginalTaxRateBps = profile.marginalTaxRateBps;
  } catch {
    homeAddress = null;
    marginalTaxRateBps = null;
  }

  try {
    [jahre, totals] = await Promise.all([listYears(), totalsForYear(jahr)]);
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
    />
  );
}
