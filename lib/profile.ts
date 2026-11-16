import { getPrisma } from "./prisma";

export async function getHomeAddress(githubId: string): Promise<string | null> {
  const profile = await getPrisma().profile.findUnique({
    where: { githubId },
    select: { homeAddress: true },
  });
  const address = profile?.homeAddress?.trim();
  return address ? address : null;
}

export async function saveHomeAddress(
  githubId: string,
  homeAddress: string | null,
): Promise<string | null> {
  const profile = await getPrisma().profile.upsert({
    where: { githubId },
    create: { githubId, homeAddress },
    update: { homeAddress },
    select: { homeAddress: true },
  });
  const address = profile.homeAddress?.trim();
  return address ? address : null;
}
