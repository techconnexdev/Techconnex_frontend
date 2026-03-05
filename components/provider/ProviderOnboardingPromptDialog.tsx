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
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-6 pt-8 pb-6 text-white">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-white">
              Get more visibility & AI-powered matches
            </DialogTitle>
            <DialogDescription className="text-center text-blue-100 mt-2 text-base">
              Complete 4 quick steps (~5–10 min) to unlock better project recommendations and appear higher in client searches.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5 bg-white">
          {/* Benefits */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900 text-sm">Why do it?</p>
              <ul className="text-sm text-emerald-800 mt-1 space-y-0.5">
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
            <ul className="space-y-2">
              {STEPS.map((step, i) => (
                <li
                  key={step.label}
                  className="flex items-center gap-3 text-sm text-gray-700"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <step.icon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="font-medium">{step.label}</span>
                  <span className="text-gray-400 hidden sm:inline">— {step.short}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Takes about 5–10 minutes. You can save and continue later.</span>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-gray-50 border-t flex-row gap-2 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleMaybeLater}
            className="text-gray-600 hover:text-gray-900"
          >
            Maybe later
          </Button>
          <Link href="/provider/onboarding" onClick={() => onOpenChange(false)}>
            <Button type="button" className="bg-blue-600 hover:bg-blue-700">
              Complete my profile
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
