// lib/timeline-utils.ts

/**
 * Converts timelineAmount and timelineUnit to a display string
 * @param amount - The timeline amount (e.g., 2) or a pre-formatted string (e.g., "32 days")
 * @param unit - The timeline unit ('day', 'week', or 'month')
 * @returns Formatted string (e.g., "2 weeks")
 */
export function formatTimeline(amount: number | string | null | undefined, unit?: string | null | undefined): string {
  // Handle null/undefined
  if (amount === null || amount === undefined) return "—";
  
  // If we have a pre-formatted timeline string (contains "day", "week", or "month"), return it as-is
  if (!unit && typeof amount === "string") {
    const trimmed = amount.trim();
    if (trimmed.includes("day") || trimmed.includes("week") || trimmed.includes("month")) {
      return trimmed;
    }
    // If it's a plain string but not formatted, try to treat it as a number
    const num = Number(trimmed);
    if (isNaN(num) || num <= 0) {
      // If it's not a valid number, return it as-is if it has content, otherwise return "—"
      return trimmed || "—";
    }
    // If it's a valid number string without unit, format it as days
    const plural = num > 1 ? "s" : "";
    return `${num} day${plural}`;
  }
  
  // Handle number input
  if (typeof amount === "number") {
    if (isNaN(amount) || amount <= 0) return "—";
    
    // If unit is provided, format it
    if (unit && ["day", "week", "month"].includes(unit)) {
      const plural = amount > 1 ? "s" : "";
      return `${amount} ${unit}${plural}`;
    }
    
    // If no unit provided, assume days
    const plural = amount > 1 ? "s" : "";
    return `${amount} day${plural}`;
  }
  
  // Handle string that needs conversion
  if (typeof amount === "string") {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) return "—";
    
    // If unit is provided, format it
    if (unit && ["day", "week", "month"].includes(unit)) {
      const plural = num > 1 ? "s" : "";
      return `${num} ${unit}${plural}`;
    }
    
    // If no unit provided, assume days
    const plural = num > 1 ? "s" : "";
    return `${num} day${plural}`;
  }
  
  return "—";
}

/**
 * Converts timelineAmount and timelineUnit to days
 * @param amount - The timeline amount (e.g., 2)
 * @param unit - The timeline unit ('day', 'week', or 'month')
 * @returns Number of days
 */
export function timelineToDays(amount: number | string | null | undefined, unit?: string | null | undefined): number {
  if (!amount) return 0;
  
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return 0;
  
  if (!unit) return num; // Assume days if no unit provided
  
  switch (unit) {
    case "day":
      return num;
    case "week":
      return num * 7;
    case "month":
      return num * 30; // Approximate: 30 days per month
    default:
      return num;
  }
}

/**
 * Builds timeline data from amount and unit
 * @param amount - The timeline amount
 * @param unit - The timeline unit ('day', 'week', or 'month')
 * @returns Object with timeline (string) and timelineInDays (number)
 */
export function buildTimelineData(amount: number | string | null | undefined, unit?: string | null | undefined): {
  timeline: string;
  timelineInDays: number;
} {
  const timeline = formatTimeline(amount, unit);
  const timelineInDays = timelineToDays(amount, unit);
  
  return {
    timeline,
    timelineInDays,
  };
}

