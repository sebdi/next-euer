import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { isAllowedGitHubUserId } from "@/lib/auth/allowlist";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "github") return false;
      const githubId = profile && "id" in profile ? profile.id : undefined;
      return isAllowedGitHubUserId(githubId);
    },
    async jwt({ token, profile, account }) {
      if (account?.provider === "github" && profile && "id" in profile) {
        const githubId = String(profile.id);
        if (!isAllowedGitHubUserId(githubId)) {
          token.githubId = undefined;
          token.login = undefined;
          return token;
        }
        token.githubId = githubId;
        token.login =
          "login" in profile && typeof profile.login === "string"
            ? profile.login
            : typeof token.login === "string"
              ? token.login
              : undefined;
        if ("name" in profile && typeof profile.name === "string") {
          token.name = profile.name;
        }
        if ("avatar_url" in profile && typeof profile.avatar_url === "string") {
          token.picture = profile.avatar_url;
        }
      }
      if (token.githubId && !isAllowedGitHubUserId(token.githubId)) {
        token.githubId = undefined;
        token.login = undefined;
      }
      return token;
    },
    async session({ session, token }) {
      const githubId =
        typeof token.githubId === "string" ? token.githubId : "";
      const login = typeof token.login === "string" ? token.login : "";
      if (!githubId || !isAllowedGitHubUserId(githubId)) {
        session.user.githubId = "";
        session.user.login = "";
        return session;
      }
      session.user.githubId = githubId;
      session.user.login = login;
      return session;
    },
  },
});
