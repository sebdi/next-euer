import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAllowedGitHubUserId } from "@/lib/auth/allowlist";

export type AuthorizedUser = {
  githubId: string;
  name: string;
  login: string;
  avatarUrl?: string;
};

export async function getAuthorizedUser(): Promise<AuthorizedUser | null> {
  const session = await auth();
  const githubId = session?.user?.githubId;
  if (!githubId || !isAllowedGitHubUserId(githubId)) return null;
  return {
    githubId,
    name: session.user.name?.trim() || session.user.login || "Konto",
    login: session.user.login || "",
    avatarUrl: session.user.image ?? undefined,
  };
}

export async function requireUser(): Promise<AuthorizedUser> {
  const user = await getAuthorizedUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireApiUser(): Promise<AuthorizedUser | null> {
  return getAuthorizedUser();
}
