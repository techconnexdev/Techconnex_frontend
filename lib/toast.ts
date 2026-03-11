import { toast as originalToast } from "sonner";

let getIsOffline: () => boolean = () => false;

export function setOfflineGetter(fn: () => boolean): void {
  getIsOffline = fn;
}

function shouldSuppressError(): boolean {
  return getIsOffline();
}

const wrappedError: typeof originalToast.error = (message, options) => {
  if (shouldSuppressError()) return undefined as ReturnType<typeof originalToast.error>;
  return originalToast.error(message, options);
};

const toastFn = (...args: Parameters<typeof originalToast>) => originalToast(...args);
export const toast = Object.assign(toastFn, originalToast, { error: wrappedError });
