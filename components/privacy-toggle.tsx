"use client";

import { Eye, EyeOff } from "lucide-react";
import { Hint } from "@/components/ui/tooltip";
import { usePrivacy } from "@/hooks/use-privacy";
import { cn } from "@/lib/utils";

export function PrivacyToggle() {
  const { on, toggle } = usePrivacy();
  const label = on ? "Details einblenden" : "Details verbergen";

  return (
    <Hint label={label}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={label}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-full border text-subtle-foreground transition-colors duration-150 hover:text-foreground",
          on && "bg-accent text-foreground shadow-[0_0_0_1px_var(--border)]",
        )}
      >
        {on ? (
          <EyeOff className="size-3.5" aria-hidden />
        ) : (
          <Eye className="size-3.5" aria-hidden />
        )}
      </button>
    </Hint>
  );
}
