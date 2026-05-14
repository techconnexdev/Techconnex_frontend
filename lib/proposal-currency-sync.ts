import { convertWithSnapshot, type FxRatesMap } from "@/lib/fx-snapshot";
import { parseBidAmountInput } from "@/lib/utils";

/** Raw project-currency string from preferred bid input (stored unformatted, like bidAmount). */
export function syncBidProjectStringFromPreferred(
  preferredRaw: string,
  pref: string,
  proj: string,
  rates: FxRatesMap,
): string {
  if (pref === proj) return preferredRaw;
  const n = parseFloat(parseBidAmountInput(preferredRaw));
  if (!Number.isFinite(n) || n <= 0) return "";
  const c = convertWithSnapshot({
    amount: n,
    fromCurrencyCode: pref,
    toCurrencyCode: proj,
    ratesMap: rates,
  });
  if (c == null) return "";
  return parseBidAmountInput(String(c));
}

/** Raw preferred-currency string from project bid input. */
export function syncBidPreferredStringFromProject(
  projectRaw: string,
  pref: string,
  proj: string,
  rates: FxRatesMap,
): string {
  if (pref === proj) return projectRaw;
  const n = parseFloat(parseBidAmountInput(projectRaw));
  if (!Number.isFinite(n) || n < 0) return "";
  const c = convertWithSnapshot({
    amount: n,
    fromCurrencyCode: proj,
    toCurrencyCode: pref,
    ratesMap: rates,
  });
  if (c == null) return "";
  return parseBidAmountInput(String(c));
}

/** Raw project-currency string for milestone from preferred amount. */
export function milestoneProjectStrFromPreferredAmount(
  amount: number,
  pref: string,
  proj: string,
  rates: FxRatesMap,
): string {
  if (pref === proj) return "";
  if (!Number.isFinite(amount) || amount <= 0) return "";
  const c = convertWithSnapshot({
    amount,
    fromCurrencyCode: pref,
    toCurrencyCode: proj,
    ratesMap: rates,
  });
  if (c == null) return "";
  return parseBidAmountInput(String(c));
}

export function milestonePreferredFromProjectRaw(
  projectRaw: string,
  pref: string,
  proj: string,
  rates: FxRatesMap,
): { amount: number; amountProjectStr: string } {
  const raw = parseBidAmountInput(projectRaw);
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) {
    return { amount: 0, amountProjectStr: raw };
  }
  if (pref === proj) {
    return { amount: n, amountProjectStr: raw };
  }
  const c = convertWithSnapshot({
    amount: n,
    fromCurrencyCode: proj,
    toCurrencyCode: pref,
    ratesMap: rates,
  });
  return {
    amount: c != null && Number.isFinite(c) ? c : 0,
    amountProjectStr: raw,
  };
}
