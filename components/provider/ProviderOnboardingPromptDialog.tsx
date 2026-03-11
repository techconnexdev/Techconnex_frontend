"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  TrendingUp,
  Target,
  FileText,
  Award,
  Link2,
  CheckCircle2,
} from "lucide-react";

const ONBOARDING_DISMISSED_KEY = "provider_onboarding_dismissed";
const ONBOARDING_COMPLETED_KEY = "provider_onboarding_completed";

export function getOnboardingDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
}

export function setOnboardingDismissed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
}

export function getOnboardingCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "1";
}

export function setOnboardingCompleted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, "1");
}

/** Clear onboarding dialog cache (dismissed/completed). Call on logout so the dialog can re-validate on next login. */
export function clearOnboardingCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
  localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
}

const STEPS = [
  { icon: FileText, label: "Profile & CV", short: "Your intro & resume" },
  { icon: Target, label: "Skills & Experience", short: "What you offer" },
  { icon: Link2, label: "Portfolio & Links", short: "Show your work" },
  { icon: Award, label: "Certifications", short: "Credentials" },
  { icon: CheckCircle2, label: "Review & Summary", short: "Quick check" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProviderOnboardingPromptDialog({ open, onOpenChange }: Props) {
  const handleMaybeLater = () => {
    setOnboardingDismissed();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4 pt-6 pb-4 sm:px-6 sm:pt-8 sm:pb-6 text-white shrink-0">
          <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur mb-3 sm:mb-4">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-2xl font-bold text-center text-white leading-tight">
              Get more visibility & AI-powered matches
            </DialogTitle>
            <DialogDescription className="text-center text-blue-100 mt-1.5 sm:mt-2 text-sm sm:text-base">
              Complete 4 quick steps (~5–10 min) to unlock better project recommendations and appear higher in client searches.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5 bg-white overflow-y-auto flex-1 min-h-0">
          {/* Benefits */}
          <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-50 border border-emerald-100">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-emerald-900 text-xs sm:text-sm">Why do it?</p>
              <ul className="text-xs sm:text-sm text-emerald-800 mt-1 space-y-0.5">
                <li>• AI recommends projects that fit your skills</li>
                <li>• Higher visibility to clients looking for your expertise</li>
                <li>• Match score and insights on every opportunity</li>
              </ul>
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              What you’ll fill in
            </p>
            <ul className="space-y-1.5 sm:space-y-2">
              {STEPS.map((step, i) => (
                <li
                  key={step.label}
                  className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700"
                >
                  <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-100 font-medium text-gray-600 shrink-0 text-xs sm:text-sm">
                    {i + 1}
                  </span>
                  <step.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                  <span className="font-medium truncate">{step.label}</span>
                  <span className="text-gray-400 hidden sm:inline shrink-0">— {step.short}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-500">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 mt-0.5" />
            <span>Takes about 5–10 minutes. You can save and continue later.</span>
          </div>
        </div>

        <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 border-t flex-col-reverse sm:flex-row gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleMaybeLater}
            className="w-full sm:w-auto text-gray-600 hover:text-gray-900 order-2 sm:order-1"
          >
            Maybe later
          </Button>
          <Link href="/provider/onboarding" onClick={() => onOpenChange(false)} className="w-full sm:w-auto order-1 sm:order-2">
            <Button type="button" className="w-full bg-blue-600 hover:bg-blue-700">
              Complete my profile
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
