import { getPrisma } from "./prisma";

export type UserProfile = {
  homeAddress: string | null;
  marginalTaxRateBps: number | null;
};

const emptyProfile: UserProfile = {
  homeAddress: null,
  marginalTaxRateBps: null,
};

function toProfile(row: {
  homeAddress: string | null;
  marginalTaxRateBps: number | null;
} | null): UserProfile {
  if (!row) return emptyProfile;
  const address = row.homeAddress?.trim();
  return {
    homeAddress: address ? address : null,
    marginalTaxRateBps: row.marginalTaxRateBps,
  };
}

export async function getUserProfile(githubId: string): Promise<UserProfile> {
  const profile = await getPrisma().profile.findUnique({
    where: { githubId },
    select: { homeAddress: true, marginalTaxRateBps: true },
  });
  return toProfile(profile);
}

export async function getHomeAddress(githubId: string): Promise<string | null> {
  return (await getUserProfile(githubId)).homeAddress;
}

export async function saveUserProfile(
  githubId: string,
  settings: UserProfile,
): Promise<UserProfile> {
  const profile = await getPrisma().profile.upsert({
    where: { githubId },
    create: { githubId, ...settings },
    update: settings,
    select: { homeAddress: true, marginalTaxRateBps: true },
  });
  return toProfile(profile);
}
