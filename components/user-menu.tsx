"use client";

import { Avatar } from "radix-ui";
import { ExternalLink, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEMO_USER } from "@/lib/user";

export function UserMenu() {
  const user = DEMO_USER;
  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full transition-opacity hover:opacity-80"
        aria-label="Benutzermenü"
      >
        <Avatar.Root className="flex size-7 items-center justify-center overflow-hidden rounded-full border bg-muted">
          <Avatar.Image src={user.avatarUrl} alt="" className="size-full" />
          <Avatar.Fallback className="text-[10px] font-medium text-muted-foreground">
            {initials}
          </Avatar.Fallback>
        </Avatar.Root>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-muted-foreground">@{user.login}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Settings /> Einstellungen
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            <ExternalLink /> GitHub öffnen
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            toast("Anmeldung ist in dieser Demo noch nicht angebunden.")
          }
        >
          <LogOut /> Abmelden
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
