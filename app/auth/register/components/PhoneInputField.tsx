"use client";

import { Label } from "@/components/ui/label";
import PhoneInputLib from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import "react-phone-number-input/style.css";

type PhoneInputFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: "MY" | "US" | "GB" | "SG" | "ID" | "TH" | (string & {});
  placeholder?: string;
  required?: boolean;
};

export function PhoneInputField({
  id,
  label,
  value,
  onChange,
  defaultCountry = "MY",
  placeholder = "Enter phone number",
  required = false,
}: PhoneInputFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        className="PhoneInputWrapper flex h-10 w-full items-center rounded-md border border-gray-200 bg-white/50 px-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500"
        style={
          {
            "--PhoneInput-color--focus": "#3b82f6",
            "--PhoneInputCountryFlag-borderColor--focus": "#3b82f6",
          } as React.CSSProperties
        }
      >
        <PhoneInputLib
          international
          defaultCountry={defaultCountry as "MY"}
          countryCallingCodeEditable={false}
          limitMaxLength
          value={value || undefined}
          onChange={(val) => onChange(val ? String(val) : "")}
          placeholder={placeholder}
          labels={en}
          className="flex flex-1 min-w-0 border-0 bg-transparent shadow-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          numberInputProps={{
            id,
            required,
            className:
              "flex h-9 flex-1 min-w-0 rounded-md border-0 bg-transparent px-2 text-base outline-none placeholder:text-gray-400 focus:ring-0 focus-visible:ring-0 md:text-sm",
          }}
        />
      </div>
    </div>
  );
}
