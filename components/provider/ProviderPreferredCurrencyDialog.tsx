"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Globe2, TrendingUp } from "lucide-react";
import { mergeUserPreferredCurrencyInStorage } from "@/lib/userLocale";
import { PREFERRED_CURRENCY_OPTIONS } from "@/lib/currency-options";
import {
  TECHCONNEX_TOUR_COMPLETED_EVENT,
  isCustomerAreaTourCompleted,
  type TechConnexTourCompletedDetail,
} from "@/components/customer/CustomerDashboardTour";

const CURRENCY_PROMPT_PREFIX = "provider_preferred_currency_prompt_seen_v1";
type Props = {
  onSaved?: () => void | Promise<void>;
  /** Wait until this page tour is done/skipped before showing (matches ProviderOpportunitiesTour). */
  tourStorageKeyPrefix?: string;
};

export function ProviderPreferredCurrencyDialog({
  onSaved,
  tourStorageKeyPrefix,
}: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("MYR");
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const seenKey = useMemo(
    () => (userId ? `${CURRENCY_PROMPT_PREFIX}:${userId}` : CURRENCY_PROMPT_PREFIX),
    [userId],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromStorageAndMaybeOpen = () => {
      try {
        const rawUser = localStorage.getItem("user");
        const rawToken = localStorage.getItem("token");
        const parsedUser = rawUser
          ? (JSON.parse(rawUser) as Record<string, unknown>)
          : null;
        const uid =
          (parsedUser?.id as string) ||
          ((parsedUser?.userId as string) ?? null) ||
          null;
        const preferred = String(
          (parsedUser?.settings as Record<string, unknown> | undefined)
            ?.preferredCurrency || "MYR",
        )
          .trim()
          .toUpperCase();
        setUserId(uid);
        setToken(rawToken || null);
        if (/^[A-Z]{3}$/.test(preferred)) setSelectedCurrency(preferred);
        const key = uid
          ? `${CURRENCY_PROMPT_PREFIX}:${uid}`
          : CURRENCY_PROMPT_PREFIX;
        const seen = localStorage.getItem(key) === "1";
        const tourDone =
          !tourStorageKeyPrefix ||
          isCustomerAreaTourCompleted(tourStorageKeyPrefix);
        if (!seen && tourDone) setOpen(true);
      } catch {
        const tourDone =
          !tourStorageKeyPrefix ||
          isCustomerAreaTourCompleted(tourStorageKeyPrefix);
        if (tourDone) setOpen(true);
      }
    };

    syncFromStorageAndMaybeOpen();

    if (!tourStorageKeyPrefix) return;

    const handler = (e: Event) => {
      const ce = e as CustomEvent<TechConnexTourCompletedDetail>;
      if (ce.detail?.storageKeyPrefix !== tourStorageKeyPrefix) return;
      syncFromStorageAndMaybeOpen();
    };
    window.addEventListener(TECHCONNEX_TOUR_COMPLETED_EVENT, handler);
    return () =>
      window.removeEventListener(TECHCONNEX_TOUR_COMPLETED_EVENT, handler);
  }, [tourStorageKeyPrefix]);

  const closeAndRemember = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(seenKey, "1");
    }
    setOpen(false);
  };

  const handleSave = async () => {
    if (!userId || !token) {
      closeAndRemember();
      return;
    }
    try {
      setSaving(true);
      setError("");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/settings/${userId}/preferred-currency`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ preferredCurrency: selectedCurrency }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body && (body.error || body.message)) || "Failed to save preferred currency",
        );
      }
      mergeUserPreferredCurrencyInStorage(selectedCurrency);
      closeAndRemember();
      await onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save preferred currency");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl">
        <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-5 pt-7 pb-5 text-white">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">
              Set Your Preferred Currency
            </DialogTitle>
            <DialogDescription className="text-center text-cyan-100 mt-2 text-sm">
              Choose how opportunity budgets and earnings should be displayed for you.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 py-5 bg-white space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-900">
              We will show your values consistently in this currency across opportunities and
              earnings.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 inline-flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-gray-500" />
              Preferred currency
            </label>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PREFERRED_CURRENCY_OPTIONS.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>

        <DialogFooter className="px-5 py-4 bg-gray-50 border-t flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={closeAndRemember}
            className="w-full sm:w-auto"
            disabled={saving}
          >
            Maybe later
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save currency"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

