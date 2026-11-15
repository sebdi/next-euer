"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { RadioGroup } from "radix-ui";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Hell", icon: Sun },
  { value: "dark", label: "Dunkel", icon: Moon },
] as const;

const noop = () => () => {};

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  return (
    <RadioGroup.Root
      aria-label="Farbschema"
      value={mounted ? theme : undefined}
      onValueChange={setTheme}
      className={cn(
        "inline-flex items-center rounded-full border p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <RadioGroup.Item
          key={value}
          value={value}
          aria-label={label}
          title={label}
          className="inline-flex size-6 items-center justify-center rounded-full text-subtle-foreground transition-colors duration-150 hover:text-foreground data-[state=checked]:bg-accent data-[state=checked]:text-foreground data-[state=checked]:shadow-[0_0_0_1px_var(--border)]"
        >
          <Icon className="size-3.5" aria-hidden />
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
