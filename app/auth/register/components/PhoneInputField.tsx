"use client";

import type { CSSProperties } from "react";
import { Label } from "@/components/ui/label";
import PhoneInputLib from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import "react-phone-number-input/style.css";
import type { Country } from "react-phone-number-input";
import { useI18n } from "@/contexts/I18nProvider";
import { guessDefaultCountryFromLocale } from "@/lib/phoneDefaultCountry";
import { SearchablePhoneCountrySelect } from "./SearchablePhoneCountrySelect";

type PhoneInputFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** When omitted, country is inferred from UI locale and browser region. */
  defaultCountry?: Country;
  placeholder?: string;
  required?: boolean;
};

export function PhoneInputField({
  id,
  label,
  value,
  onChange,
  defaultCountry: defaultCountryProp,
  placeholder = "Enter phone number",
  required = false,
}: PhoneInputFieldProps) {
  const { t, locale } = useI18n();
  const effectiveDefault =
    defaultCountryProp ?? guessDefaultCountryFromLocale(locale);

  return (
    <div className="space-y-2">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div
        className="PhoneInputWrapper flex h-10 w-full items-center rounded-md border border-gray-200 bg-white/50 px-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500"
        style={
          {
            "--PhoneInput-color--focus": "#3b82f6",
            "--PhoneInputCountryFlag-borderColor--focus": "#3b82f6",
          } as CSSProperties
        }
      >
        <PhoneInputLib
          international
          defaultCountry={effectiveDefault}
          countryCallingCodeEditable
          limitMaxLength
          value={value || undefined}
          onChange={(val) => onChange(val ? String(val) : "")}
          placeholder={placeholder}
          labels={en}
          countrySelectComponent={SearchablePhoneCountrySelect}
          countrySelectProps={{
            searchPlaceholder: t("auth.fields.phoneCountrySearchPlaceholder"),
            emptyMessage: t("auth.fields.phoneCountryEmpty"),
          }}
          className="flex min-w-0 flex-1 items-center gap-1 border-0 bg-transparent shadow-none focus-within:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          numberInputProps={{
            id,
            required,
            className:
              "flex h-9 min-w-0 flex-1 rounded-md border-0 bg-transparent px-2 text-base outline-none placeholder:text-gray-400 focus:ring-0 focus-visible:ring-0 md:text-sm",
          }}
        />
      </div>
    </div>
  );
}
