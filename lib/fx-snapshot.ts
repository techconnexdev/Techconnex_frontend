/**
 * Client-side FX helpers aligned with Backend `modules/fx/service.js`
 * (BNM snapshot: MYR base via middleRate/unit per currency).
 */

export type FxRatesMap = Record<
  string,
  { unit: number; middleRate: number }
> | null;

export function normalizeCurrencyCode(code: string | undefined | null): string {
  return typeof code === "string" ? code.trim().toUpperCase() : "";
}

export function convertWithSnapshot({
  amount,
  fromCurrencyCode,
  toCurrencyCode,
  ratesMap,
}: {
  amount: number;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  ratesMap: FxRatesMap;
}): number | null {
  const value = Number(amount);
  const fromCode = normalizeCurrencyCode(fromCurrencyCode);
  const toCode = normalizeCurrencyCode(toCurrencyCode);
  if (!Number.isFinite(value)) return null;
  if (!fromCode || !toCode || !ratesMap) return null;

  const from = ratesMap[fromCode];
  const to = ratesMap[toCode];
  if (!from || !to) return null;

  const amountInMyr = value * (Number(from.middleRate) / Number(from.unit));
  const converted = amountInMyr / (Number(to.middleRate) / Number(to.unit));

  if (!Number.isFinite(converted)) return null;
  return Number(converted.toFixed(2));
}

export function hasCurrencyInSnapshot(
  currencyCode: string,
  ratesMap: FxRatesMap,
): boolean {
  const code = normalizeCurrencyCode(currencyCode);
  return Boolean(code && ratesMap && ratesMap[code]);
}
