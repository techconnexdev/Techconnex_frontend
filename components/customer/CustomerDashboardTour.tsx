"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

export type TourStep = {
  target: string; // selector for the element, e.g. [data-tour-step="0"]
  title: string;
  content: string;
};

const DEFAULT_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Welcome to your Dashboard",
    content:
      "This is your home base.Most areas will be empty at first. As you create projects and work with providers, your stats and lists will fill in here.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Start by creating a project",
    content:
      "To get started, click here. You can create either a full project or a service request. Providers will then be able to find your request and send you proposals.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Stats cards",
    content:
      "These numbers will update as you use the platform: Active projects (current work), Completed (finished projects), Total spent (payments made), and your average rating from provider reviews. All start at zero for new users.",
  },
  {
    target: '[data-tour-step="3"]',
    title: "Recent projects list",
    content:
      "Your projects and service requests will appear here. For now it may be empty. Once you create projects, you can click any row to view details or hover over a service request to see suggested providers on the right.",
  },
  {
    target: '[data-tour-step="4"]',
    title: "Recommended providers",
    content:
      "This area shows provider suggestions when you hover over a service request in the list. Until you create and hover over a service request, it will stay empty.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Navigation menu",
    content:
      "Use this menu to go to Projects, Find Providers, Messages, Billing, and other sections. The Dashboard always shows this overview.",
  },
];

const GAP = 12;
const ARROW_SIZE = 8;
const SPOTLIGHT_PADDING = 8;

export function CustomerDashboardTour({
  steps = DEFAULT_STEPS,
  storageKeyPrefix = DEFAULT_STORAGE_KEY_PREFIX,
}: {
  steps?: TourStep[];
  storageKeyPrefix?: string;
}) {
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
  }, [storageKeyPrefix]);

  const startTour = useCallback(() => {
    if (isCompleted()) return;
    setStepIndex(0);
  }, [isCompleted]);

  const goNext = useCallback(() => {
    setStepIndex((i) => {
      if (i === null || i >= steps.length - 1) {
        completeTour();
        return null;
      }
      return i + 1;
    });
  }, [steps.length, completeTour]);

  const goBack = useCallback(() => {
    setStepIndex((i) => (i === null || i <= 0 ? 0 : i - 1));
  }, []);

  const skip = useCallback(() => {
    completeTour();
  }, [completeTour]);

  // On mount: show tour only if not completed (after a short delay so DOM is ready)
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isCompleted()) setStepIndex(0);
    }, 500);
    return () => clearTimeout(t);
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

    const el = document.querySelector(step.target);
    const popup = popupRef.current;
    if (!el || !popup) {
      setPosition(null);
      setSpotlightRect(null);
      return;
    }

    const updatePosition = () => {
      const rect = el.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
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
      const maxLeft = window.innerWidth - popupRect.width - 16;
      const minLeft = 16;

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
          aria-label="Skip tour"
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
          Skip
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
              Back
            </Button>
          )}
          <Button
            type="button"
            size="default"
            onClick={goNext}
            className="text-base"
          >
            {isLast ? "Finish" : "Next"}
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
