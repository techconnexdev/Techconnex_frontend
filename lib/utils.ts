import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Parse bid amount input: strip commas, keep digits and one decimal point. */
export function parseBidAmountInput(value: string): string {
  const stripped = value.replace(/,/g, "").replace(/[^0-9.]/g, "")
  const parts = stripped.split(".")
  if (parts.length > 2) {
    return parts[0] + "." + parts.slice(1).join("")
  }
  return stripped
}

/** Format bid amount for display: commas and up to 2 decimal places. */
export function formatBidAmountDisplay(raw: string): string {
  if (raw === "") return ""
  const num = parseFloat(raw)
  if (Number.isNaN(num)) return raw
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
