"use client";

import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserMenu } from "@/components/user-menu";
import {
  BetriebJahrMobile,
  BetriebSwitcher,
  type BetriebSwitcherProps,
} from "@/components/betriebe/betrieb-switcher";
import type { AppUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Header({
  jahr,
  jahre,
  onJahrChange,
  user,
  betrieb,
  homeHref = `/?jahr=${jahr}`,
}: {
  jahr: number;
  jahre: number[];
  onJahrChange: (jahr: number) => void;
  user: AppUser;
  /** Betriebswahl; ohne sie zeigt der Header nur das Jahr */
  betrieb?: BetriebSwitcherProps;
  homeHref?: string;
}) {
  const separator = (
    <span className="text-lg font-light text-border-strong" aria-hidden>
      /
    </span>
  );
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:px-6">
        <Link
          href={homeHref}
          aria-label="NextEÜR"
          className="shrink-0 text-[15px] tracking-tight select-none"
        >
          {betrieb && (
            <svg viewBox="0 0 32 32" aria-hidden className="size-7 md:hidden">
              <rect width="32" height="32" rx="7" className="fill-foreground" />
              <path
                d="M10 9h12v3H13.5v2.6H21v3h-7.5V20H22v3H10z"
                className="fill-background"
              />
            </svg>
          )}
          <span className={cn(betrieb && "max-md:hidden")}>
            <span className="font-medium">Next</span>
            <span className="font-semibold">EÜR</span>
          </span>
        </Link>
        <span className={cn("contents", betrieb && "max-md:hidden")}>{separator}</span>
        {betrieb && (
          <>
            <div className="hidden md:contents">
              <BetriebSwitcher {...betrieb} />
              {separator}
            </div>
            <div className="flex min-w-0 md:hidden">
              <BetriebJahrMobile
                {...betrieb}
                jahr={jahr}
                jahre={jahre}
                onJahrChange={onJahrChange}
              />
            </div>
          </>
        )}
        <Select
          value={String(jahr)}
          onValueChange={(v) => onJahrChange(Number(v))}
        >
          <SelectTrigger
            aria-label="Buchungsjahr"
            className={cn(
              "num h-8 border-transparent px-2 text-[13px] hover:border-input",
              betrieb && "max-md:hidden",
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {jahre.map((j) => (
              <SelectItem key={j} value={String(j)} className="num text-[13px]">
                {j}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
          <PrivacyToggle />
          <ThemeSwitcher />
          <UserMenu user={user} jahr={jahr} betriebId={betrieb?.betrieb.id} />
        </div>
      </div>
    </header>
  );
}
