"use client";

import { Avatar } from "radix-ui";
import { ExternalLink, LogOut, Settings } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppUser } from "@/lib/types";

export function UserMenu({ user }: { user: AppUser }) {
  const initials = (user.name || user.login || "N")
    .slice(0, 2)
    .toUpperCase();
  const githubHref = user.login
    ? `https://github.com/${encodeURIComponent(user.login)}`
    : "https://github.com";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full transition-opacity hover:opacity-80"
        aria-label="Benutzermenü"
      >
        <Avatar.Root
          data-privacy
          className="flex size-7 items-center justify-center overflow-hidden rounded-full border bg-muted"
        >
          <Avatar.Image src={user.avatarUrl} alt="" className="size-full" />
          <Avatar.Fallback className="text-[10px] font-medium text-muted-foreground">
            {initials}
          </Avatar.Fallback>
        </Avatar.Root>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div data-privacy className="text-sm font-medium">
            {user.name}
          </div>
          {user.login && (
            <div data-privacy className="text-xs text-muted-foreground">
              @{user.login}
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Settings /> Einstellungen
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={githubHref} target="_blank" rel="noreferrer">
            <ExternalLink /> GitHub öffnen
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            void signOutAction();
          }}
        >
          <LogOut /> Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
