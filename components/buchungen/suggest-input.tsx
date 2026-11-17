"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SuggestInput({
  suggestions,
  onValueChange,
  wrapperClassName,
  onFocus,
  onBlur,
  onChange,
  onKeyDown,
  ...props
}: React.ComponentProps<typeof Input> & {
  suggestions: string[];
  onValueChange: (value: string) => void;
  wrapperClassName?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const show = open && !props.disabled && suggestions.length > 0;

  const choose = (value: string) => {
    onValueChange(value);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className={cn("min-w-0", wrapperClassName)}>
      <Input
        {...props}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={show ? listId : undefined}
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        onChange={(event) => {
          setOpen(true);
          setActive(-1);
          onValueChange(event.target.value);
          onChange?.(event);
        }}
        onFocus={(event) => {
          setOpen(true);
          setActive(-1);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setOpen(false);
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (show && event.key === "ArrowDown") {
            event.preventDefault();
            setActive((index) => (index + 1) % suggestions.length);
          } else if (show && event.key === "ArrowUp") {
            event.preventDefault();
            setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
          } else if (show && event.key === "Enter" && active >= 0) {
            event.preventDefault();
            choose(suggestions[active] ?? "");
          } else if (show && event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
          }
          onKeyDown?.(event);
        }}
      />
      {show && (
        <ul
          id={listId}
          role="listbox"
          className="mt-1 max-h-40 overflow-auto rounded-md border bg-popover p-1 shadow-sm"
        >
          {suggestions.map((item, index) => (
            <li
              key={item}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
            >
              <button
                type="button"
                data-privacy
                className={cn(
                  "block w-full truncate rounded-sm px-2 py-1.5 text-left text-sm",
                  index === active && "bg-accent",
                )}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(item);
                }}
                onMouseEnter={() => setActive(index)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
