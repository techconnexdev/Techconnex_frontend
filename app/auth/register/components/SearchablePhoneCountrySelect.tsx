"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { getCountryCallingCode } from "libphonenumber-js";
import type { Country } from "react-phone-number-input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type PhoneCountryOption = {
  value?: Country;
  label: string;
  divider?: boolean;
};

type IconComponent = React.ComponentType<{
  country?: Country;
  label: string;
  aspectRatio?: number;
}>;

export type SearchablePhoneCountrySelectProps = {
  value?: Country;
  options: PhoneCountryOption[];
  onChange: (country: Country | undefined) => void;
  onFocus?: React.FocusEventHandler<HTMLButtonElement>;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  readOnly?: boolean;
  iconComponent: IconComponent;
  name?: string;
  "aria-label"?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
};

type SearchablePhoneCountrySelectAllProps = SearchablePhoneCountrySelectProps &
  Record<string, unknown>;

function safeDialCode(country?: Country): string {
  if (!country) return "";
  try {
    return `+${getCountryCallingCode(country)}`;
  } catch {
    return "";
  }
}

function optionSearchText(opt: PhoneCountryOption): string {
  if (opt.divider) return "";
  const code = opt.value ? String(opt.value).toLowerCase() : "";
  const label = (opt.label || "").toLowerCase();
  const dial = safeDialCode(opt.value).toLowerCase();
  return `${label} ${code} ${dial}`;
}

export function SearchablePhoneCountrySelect({
  value,
  options,
  onChange,
  onFocus,
  onBlur,
  disabled,
  readOnly,
  iconComponent: Icon,
  name,
  "aria-label": ariaLabel,
  searchPlaceholder = "Search country or code",
  emptyMessage = "No country found.",
}: SearchablePhoneCountrySelectAllProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const flat = React.useMemo(
    () => options.filter((o) => !o.divider),
    [options],
  );

  const selected = React.useMemo(() => {
    const match = flat.find((o) => o.value === value);
    if (match) return match;
    if (value === undefined) {
      return flat.find((o) => o.value === undefined);
    }
    return undefined;
  }, [flat, value]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flat;
    return flat.filter((opt) => optionSearchText(opt).includes(q));
  }, [flat, query]);

  const handlePick = React.useCallback(
    (country: Country | undefined) => {
      onChange(country);
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  return (
    <div className="PhoneInputCountry flex shrink-0 items-stretch">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            name={name}
            aria-label={ariaLabel}
            aria-haspopup="listbox"
            aria-expanded={open}
            disabled={disabled || readOnly}
            className={cn(
              "relative z-[1] flex h-9 min-h-[2.25rem] shrink-0 items-center gap-0.5 rounded-md px-1 py-0 font-normal",
              "hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-blue-500",
            )}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            <Icon
              country={value}
              label={selected?.label ?? ""}
            />
            <ChevronDown
              className="ml-0.5 h-3.5 w-3.5 shrink-0 opacity-50"
              aria-hidden
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(100vw-2rem,22rem)] p-0"
          align="start"
          sideOffset={6}
          collisionPadding={12}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {filtered.map((opt) => {
                  const dial = safeDialCode(opt.value);
                  const isSelected = opt.value === value;
                  return (
                    <CommandItem
                      key={opt.value ?? "__intl__"}
                      value={`${String(opt.value ?? "")} ${opt.label} ${dial}`}
                      onSelect={() => handlePick(opt.value)}
                      className="gap-2"
                    >
                      <Icon country={opt.value} label={opt.label} />
                      <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {dial}
                      </span>
                      {isSelected ? (
                        <Check className="h-4 w-4 shrink-0 text-blue-600" />
                      ) : (
                        <span className="inline-block w-4 shrink-0" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
