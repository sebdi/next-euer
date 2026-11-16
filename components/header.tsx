"use client";

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
import type { AppUser } from "@/lib/types";

export function Header({
  jahr,
  jahre,
  onJahrChange,
  user,
  homeAddress,
  onHomeAddressChange,
}: {
  jahr: number;
  jahre: number[];
  onJahrChange: (jahr: number) => void;
  user: AppUser;
  homeAddress: string | null;
  onHomeAddressChange: (homeAddress: string | null) => void;
}) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 md:px-6">
        <span className="text-[15px] tracking-tight select-none">
          <span className="font-medium">Next</span>
          <span className="font-semibold">EÜR</span>
        </span>
        <span className="text-lg font-light text-border-strong" aria-hidden>
          /
        </span>
        <Select
          value={String(jahr)}
          onValueChange={(v) => onJahrChange(Number(v))}
        >
          <SelectTrigger
            aria-label="Buchungsjahr"
            className="num h-8 border-transparent px-2 text-[13px] hover:border-input"
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
        <div className="ml-auto flex items-center gap-3">
          <PrivacyToggle />
          <ThemeSwitcher />
          <UserMenu
            user={user}
            homeAddress={homeAddress}
            onHomeAddressChange={onHomeAddressChange}
          />
        </div>
      </div>
    </header>
  );
}
