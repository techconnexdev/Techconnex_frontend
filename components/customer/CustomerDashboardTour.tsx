"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nProvider";

const DEFAULT_STORAGE_KEY_PREFIX = "customer-dashboard-tour-done";

function getStorageKey(prefix: string): string {
  if (typeof window === "undefined") return prefix;
  try {
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?.id ?? "anonymous";
    return `${prefix}-${userId}`;
  } catch {
    return prefix;
  }
}

/** Fired on the window when a tour is finished or skipped (detail.storageKeyPrefix). */
export const TECHCONNEX_TOUR_COMPLETED_EVENT = "techconnex-tour-completed";

export type TechConnexTourCompletedDetail = {
  storageKeyPrefix: string;
};

/** Same completion check the tour uses (per-user localStorage key). */
export function isCustomerAreaTourCompleted(storageKeyPrefix: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(getStorageKey(storageKeyPrefix)) === "true";
  } catch {
    return true;
  }
}

export type TourStep = {
  target: string; // selector for the element, e.g. [data-tour-step="0"]
  title: string;
  content: string;
};

const GAP = 12;
const ARROW_SIZE = 8;
const SPOTLIGHT_PADDING = 8;

export function CustomerDashboardTour({
  steps,
  storageKeyPrefix = DEFAULT_STORAGE_KEY_PREFIX,
}: {
  steps: TourStep[];
  storageKeyPrefix?: string;
}) {
  const { t } = useI18n();
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    hideArrow?: boolean;
    placement?: "top" | "bottom" | "right";
  } | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isCompleted = useCallback(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(getStorageKey(storageKeyPrefix)) === "true";
  }, [storageKeyPrefix]);

  const completeTour = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(getStorageKey(storageKeyPrefix), "true");
    setStepIndex(null);
    setPosition(null);
    setSpotlightRect(null);
    window.dispatchEvent(
      new CustomEvent(TECHCONNEX_TOUR_COMPLETED_EVENT, {
        detail: { storageKeyPrefix } satisfies TechConnexTourCompletedDetail,
      }),
    );
  }, [storageKeyPrefix]);

  const startTour = useCallback(() => {
    if (isCompleted()) return;
    setStepIndex(0);
  }, [isCompleted]);

  const goNext = useCallback(() => {
    if (stepIndex === null || stepIndex >= steps.length - 1) {
      completeTour();
      return;
    }
    setStepIndex(stepIndex + 1);
  }, [completeTour, stepIndex, steps.length]);

  const goBack = useCallback(() => {
    setStepIndex((i) => (i === null || i <= 0 ? 0 : i - 1));
  }, []);

  const skip = useCallback(() => {
    completeTour();
  }, [completeTour]);

  // On mount: show tour only if not completed (after a short delay so DOM is ready)
  useEffect(() => {
    const tourStartTimer = setTimeout(() => {
      if (!isCompleted()) setStepIndex(0);
    }, 500);
    return () => clearTimeout(tourStartTimer);
  }, [isCompleted]);

  // Position popup and spotlight overlay
  useEffect(() => {
    if (stepIndex === null || typeof document === "undefined") {
      setPosition(null);
      setSpotlightRect(null);
      return;
    }

    const step = steps[stepIndex];
    if (!step) {
      setPosition(null);
      setSpotlightRect(null);
      return;
    }

    const popup = popupRef.current;
    if (!popup) {
      setPosition(null);
      setSpotlightRect(null);
      return;
    }

    const updatePosition = () => {
      const targetEl = document.querySelector(step.target);
      const popupEl = popupRef.current;
      if (!popupEl) return;

      const popupRect = popupEl.getBoundingClientRect();
      const maxLeft = window.innerWidth - popupRect.width - 16;
      const minLeft = 16;

      // Target missing (e.g. skeleton / conditional UI) or not measurable yet
      if (!targetEl) {
        if (popupRect.width < 1 || popupRect.height < 1) return;
        const left = window.innerWidth / 2 - popupRect.width / 2;
        const clampedLeft = Math.min(maxLeft, Math.max(minLeft, left));
        const top = window.innerHeight / 2 - popupRect.height / 2;
        const clampedTop = Math.max(16, top);
        setPosition({
          top: clampedTop,
          left: clampedLeft,
          hideArrow: true,
        });
        setSpotlightRect(null);
        return;
      }

      const rect = targetEl.getBoundingClientRect();
      const hasVisibleTarget = rect.width > 0 && rect.height > 0;

      // Update spotlight cutout for visible targets (clamped to viewport)
      if (hasVisibleTarget) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const top = Math.max(0, rect.top - SPOTLIGHT_PADDING);
        const left = Math.max(0, rect.left - SPOTLIGHT_PADDING);
        const width = Math.min(rect.width + SPOTLIGHT_PADDING * 2, vw - left);
        const height = Math.min(rect.height + SPOTLIGHT_PADDING * 2, vh - top);
        setSpotlightRect({ top, left, width, height });
      } else {
        setSpotlightRect(null);
      }

      if (!hasVisibleTarget) {
        const left = window.innerWidth / 2 - popupRect.width / 2;
        const clampedLeft = Math.min(maxLeft, Math.max(minLeft, left));
        const top = window.innerHeight / 2 - popupRect.height / 2;
        const clampedTop = Math.max(16, top);
        setPosition({
          top: clampedTop,
          left: clampedLeft,
          hideArrow: true,
        });
        setSpotlightRect(null);
        return;
      }

      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceRight = window.innerWidth - rect.right;
      const popupNeeded = popupRect.height + GAP + ARROW_SIZE;

      // For narrow targets (e.g. sidebar), place popup to the right so target stays visible
      const isNarrowTarget = rect.width < popupRect.width;
      const hasSpaceRight = spaceRight >= popupRect.width + GAP + ARROW_SIZE;

      if (isNarrowTarget && hasSpaceRight) {
        // Place to the right of target (arrow points left)
        const left = rect.right + GAP + ARROW_SIZE;
        const clampedLeft = Math.min(maxLeft, Math.max(minLeft, left));
        const top = rect.top + rect.height / 2 - popupRect.height / 2;
        const clampedTop = Math.max(
          16,
          Math.min(window.innerHeight - popupRect.height - 16, top),
        );
        setPosition({
          top: clampedTop,
          left: clampedLeft,
          hideArrow: false,
          placement: "right",
        });
      } else if (spaceAbove >= popupNeeded) {
        // Place above target (arrow points down)
        const left = rect.left + rect.width / 2 - popupRect.width / 2;
        const clampedLeft = Math.min(maxLeft, Math.max(minLeft, left));
        const top = rect.top - popupRect.height - GAP - ARROW_SIZE;
        const clampedTop = Math.max(16, top);
        setPosition({
          top: clampedTop,
          left: clampedLeft,
          hideArrow: false,
          placement: "top",
        });
      } else if (spaceBelow >= popupNeeded) {
        // Place below target (arrow points up)
        const left = rect.left + rect.width / 2 - popupRect.width / 2;
        const clampedLeft = Math.min(maxLeft, Math.max(minLeft, left));
        const top = rect.bottom + GAP + ARROW_SIZE;
        const clampedTop = Math.min(
          window.innerHeight - popupRect.height - 16,
          top,
        );
        setPosition({
          top: clampedTop,
          left: clampedLeft,
          hideArrow: false,
          placement: "bottom",
        });
      } else {
        // Fallback: center
        const left = rect.left + rect.width / 2 - popupRect.width / 2;
        const clampedLeft = Math.min(maxLeft, Math.max(minLeft, left));
        const top = window.innerHeight / 2 - popupRect.height / 2;
        setPosition({
          top: Math.max(16, top),
          left: clampedLeft,
          hideArrow: true,
        });
      }
    };

    // Run after paint so popup has dimensions
    let rafId: number;
    rafId = requestAnimationFrame(() => {
      updatePosition();
    });

    const ro = new ResizeObserver(updatePosition);
    ro.observe(popup);

    const scrollHandler = () => requestAnimationFrame(updatePosition);
    window.addEventListener("scroll", scrollHandler, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("scroll", scrollHandler, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [stepIndex, steps]);

  // Highlight target element (optional) and scroll into view
  useEffect(() => {
    if (stepIndex === null) return;
    const step = steps[stepIndex];
    if (!step) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [stepIndex, steps]);

  if (stepIndex === null) return null;

  const step = steps[stepIndex];
  if (!step) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const popupContent = (
    <div
      ref={popupRef}
      role="dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-content"
      className={cn(
        "fixed z-[100] w-[min(440px,calc(100vw-32px))] rounded-xl border border-gray-200 bg-white p-6 shadow-xl",
        "animate-in fade-in-0 zoom-in-95 duration-200",
      )}
      style={
        position
          ? {
              top: `${position.top}px`,
              left: `${position.left}px`,
            }
          : { visibility: "hidden" as const }
      }
    >
      {/* Arrow: down (above), up (below), or left (right of target) */}
      {position && !position.hideArrow && (
        <div
          className={cn(
            "absolute border-8 border-transparent w-0 h-0",
            position.placement === "bottom" &&
              "left-1/2 -translate-x-1/2 border-b-gray-200",
            position.placement === "top" &&
              "left-1/2 -translate-x-1/2 border-t-gray-200",
            position.placement === "right" &&
              "top-1/2 -translate-y-1/2 border-r-gray-200",
          )}
          style={
            position.placement === "bottom"
              ? { top: -(GAP + ARROW_SIZE) }
              : position.placement === "top"
                ? { bottom: -(GAP + ARROW_SIZE) }
                : { left: -(GAP + ARROW_SIZE) }
          }
        />
      )}
      <div className="flex items-start justify-between gap-2 mb-4">
        <h3 id="tour-title" className="text-xl font-semibold text-gray-900">
          {step.title}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0 text-gray-500 hover:text-gray-700"
          onClick={skip}
          aria-label={t("customer.tour.skipAria")}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <p
        id="tour-content"
        className="text-base text-gray-600 mb-5 leading-relaxed"
      >
        {step.content}
      </p>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="default"
          onClick={skip}
          className="text-base"
        >
          {t("customer.tour.skip")}
        </Button>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={goBack}
              className="text-base"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("customer.tour.back")}
            </Button>
          )}
          <Button
            type="button"
            size="default"
            onClick={goNext}
            className="text-base"
          >
            {isLast ? t("customer.tour.finish") : t("customer.tour.next")}
            {!isLast && <ChevronRight className="h-5 w-5 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );

  // Spotlight overlay: dim everything except the target - only the sidebar/target area stays bright
  const overlayContent = spotlightRect ? (
    <div ref={overlayRef} className="fixed inset-0 z-[99]" aria-hidden>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <mask id="spotlight-cutout">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={spotlightRect.left}
              y={spotlightRect.top}
              width={spotlightRect.width}
              height={spotlightRect.height}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#spotlight-cutout)"
        />
      </svg>
      {/* Click handlers for dimmed areas - cutout passes clicks through to target */}
      <div
        className="absolute left-0 right-0 top-0 bg-transparent cursor-pointer"
        style={{ height: Math.max(0, spotlightRect.top) }}
        onClick={skip}
      />
      <div
        className="absolute left-0 right-0 bottom-0 bg-transparent cursor-pointer"
        style={{ top: spotlightRect.top + spotlightRect.height }}
        onClick={skip}
      />
      <div
        className="absolute bg-transparent cursor-pointer"
        style={{
          top: spotlightRect.top,
          left: 0,
          width: Math.max(0, spotlightRect.left),
          height: spotlightRect.height,
        }}
        onClick={skip}
      />
      <div
        className="absolute bg-transparent cursor-pointer"
        style={{
          top: spotlightRect.top,
          left: spotlightRect.left + spotlightRect.width,
          right: 0,
          height: spotlightRect.height,
        }}
        onClick={skip}
      />
      {/* Highlight ring around the target area only */}
      <div
        className="absolute z-[99] rounded-lg pointer-events-none ring-2 ring-white"
        style={{
          top: spotlightRect.top,
          left: spotlightRect.left,
          width: spotlightRect.width,
          height: spotlightRect.height,
        }}
        aria-hidden
      />
    </div>
  ) : (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[99] bg-black/50"
      aria-hidden
      onClick={skip}
    />
  );

  return (
    <>
      {createPortal(overlayContent, document.body)}
      {createPortal(popupContent, document.body)}
    </>
  );
}

export function CustomerDashboardHomeTour() {
  const { t } = useI18n();
  const steps = useMemo<TourStep[]>(
    () => [
      {
        target: '[data-tour-step="0"]',
        title: t("customer.dashboard.tour.step0.title"),
        content: t("customer.dashboard.tour.step0.content"),
      },
      {
        target: '[data-tour-step="1"]',
        title: t("customer.dashboard.tour.step1.title"),
        content: t("customer.dashboard.tour.step1.content"),
      },
      {
        target: '[data-tour-step="2"]',
        title: t("customer.dashboard.tour.step2.title"),
        content: t("customer.dashboard.tour.step2.content"),
      },
      {
        target: '[data-tour-step="3"]',
        title: t("customer.dashboard.tour.step3.title"),
        content: t("customer.dashboard.tour.step3.content"),
      },
      {
        target: '[data-tour-step="4"]',
        title: t("customer.dashboard.tour.step4.title"),
        content: t("customer.dashboard.tour.step4.content"),
      },
      {
        target: '[data-tour-step="5"]',
        title: t("customer.dashboard.tour.step5.title"),
        content: t("customer.dashboard.tour.step5.content"),
      },
    ],
    [t],
  );

  return <CustomerDashboardTour steps={steps} />;
}
