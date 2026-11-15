import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { getAuthorizedUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  AccessDenied:
    "Dieses GitHub-Konto ist für diese Instanz nicht freigeschaltet.",
  Configuration: "Die Anmeldung ist nicht vollständig konfiguriert.",
  OAuthAccountNotLinked: "Dieses GitHub-Konto kann nicht verwendet werden.",
  Default: "Die Anmeldung ist fehlgeschlagen.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getAuthorizedUser();
  if (user) redirect("/");

  const { error } = await searchParams;
  const message = error
    ? (ERRORS[error] ?? ERRORS.Default)
    : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:px-6">
          <span className="text-[15px] tracking-tight select-none">
            <span className="font-medium">Next</span>
            <span className="font-semibold">EÜR</span>
          </span>
          <div className="ml-auto">
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Anmelden</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Nur das hinterlegte GitHub-Konto dieser Instanz hat Zugriff.
        </p>

        {message && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
          >
            {message}
          </p>
        )}

        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="primary" className="w-full">
            Mit GitHub anmelden
          </Button>
        </form>
      </main>
    </div>
  );
}
