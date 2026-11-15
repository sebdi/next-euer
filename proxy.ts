import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAllowedGitHubUserId } from "@/lib/auth/allowlist";

function isPublicPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  );
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const githubId = req.auth?.user?.githubId;
  const authorized = Boolean(githubId && isAllowedGitHubUserId(githubId));

  if (isPublicPath(pathname)) {
    if (authorized && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!authorized) {
    const login = new URL("/login", req.nextUrl);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
