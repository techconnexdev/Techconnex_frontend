"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  type CSSProperties,
} from "react";
import { Button } from "@/components/ui/button";
import { Bot, ChevronDown, Maximize2, Minimize2 } from "lucide-react";
import { SupportChatClient } from "./SupportChatClient";
import { useI18n } from "@/contexts/I18nProvider";

const PANEL_WIDTH = 380;
const PANEL_HEIGHT_DESKTOP = 520;
const PANEL_WIDTH_EXPANDED = 560;
const PANEL_HEIGHT_EXPANDED_DESKTOP = 720;
const MOBILE_BREAKPOINT = 768;
const EXPANDED_STORAGE_KEY = "support-chat-widget-expanded";
const POSITION_STORAGE_KEY = "support-chat-widget-fab-position";

const FAB_SIZE = 56;
const VIEW_MARGIN = 24;
const FAB_PANEL_GAP = 8;
/** Pixels of movement before we treat the gesture as a drag (not a click). */
const DRAG_THRESHOLD_PX = 8;

type FabPosition = { left: number; top: number };

function getDefaultFabPosition(vw: number, vh: number): FabPosition {
  return {
    left: vw - VIEW_MARGIN - FAB_SIZE,
    top: vh - VIEW_MARGIN - FAB_SIZE,
  };
}

function clampFabPosition(left: number, top: number, vw: number, vh: number): FabPosition {
  const maxLeft = vw - VIEW_MARGIN - FAB_SIZE;
  const maxTop = vh - VIEW_MARGIN - FAB_SIZE;
  return {
    left: Math.min(Math.max(VIEW_MARGIN, left), maxLeft),
    top: Math.min(Math.max(VIEW_MARGIN, top), maxTop),
  };
}

/** Snap FAB to the nearest screen edge (with margin); keeps the slide-along-edge position. */
function snapFabToNearestEdge(pos: FabPosition, vw: number, vh: number): FabPosition {
  const maxLeft = vw - VIEW_MARGIN - FAB_SIZE;
  const maxTop = vh - VIEW_MARGIN - FAB_SIZE;
  const cx = pos.left + FAB_SIZE / 2;
  const cy = pos.top + FAB_SIZE / 2;
  const xLeft = VIEW_MARGIN + FAB_SIZE / 2;
  const xRight = vw - VIEW_MARGIN - FAB_SIZE / 2;
  const yTop = VIEW_MARGIN + FAB_SIZE / 2;
  const yBottom = vh - VIEW_MARGIN - FAB_SIZE / 2;

  const distLeft = Math.abs(cx - xLeft);
  const distRight = Math.abs(cx - xRight);
  const distTop = Math.abs(cy - yTop);
  const distBottom = Math.abs(cy - yBottom);

  let edge: "left" | "right" | "top" | "bottom" = "left";
  let d = distLeft;
  if (distRight < d) {
    edge = "right";
    d = distRight;
  }
  if (distTop < d) {
    edge = "top";
    d = distTop;
  }
  if (distBottom < d) {
    edge = "bottom";
    d = distBottom;
  }

  switch (edge) {
    case "left":
      return { left: VIEW_MARGIN, top: Math.min(Math.max(VIEW_MARGIN, pos.top), maxTop) };
    case "right":
      return { left: maxLeft, top: Math.min(Math.max(VIEW_MARGIN, pos.top), maxTop) };
    case "top":
      return { left: Math.min(Math.max(VIEW_MARGIN, pos.left), maxLeft), top: VIEW_MARGIN };
    default:
      return { left: Math.min(Math.max(VIEW_MARGIN, pos.left), maxLeft), top: maxTop };
  }
}

function getDesktopPanelStyle(
  fab: FabPosition,
  vw: number,
  vh: number,
  expanded: boolean,
): CSSProperties {
  const panelWidthPx = expanded ? Math.min(vw * 0.9, PANEL_WIDTH_EXPANDED) : PANEL_WIDTH;
  const panelHeightPx = expanded ? PANEL_HEIGHT_EXPANDED_DESKTOP : PANEL_HEIGHT_DESKTOP;
  const maxPanelH = Math.min(panelHeightPx, vh - 2 * VIEW_MARGIN);

  let right = vw - fab.left - FAB_SIZE;
  const panelLeft = vw - right - panelWidthPx;
  if (panelLeft < VIEW_MARGIN) {
    right = vw - VIEW_MARGIN - panelWidthPx;
  }

  let bottom = vh - fab.top + FAB_PANEL_GAP;
  const panelTop = vh - bottom - maxPanelH;
  if (panelTop < VIEW_MARGIN) {
    bottom = vh - VIEW_MARGIN - maxPanelH;
  }

  return {
    bottom,
    right,
    width: expanded ? "min(90vw, 560px)" : PANEL_WIDTH,
    height: expanded ? PANEL_HEIGHT_EXPANDED_DESKTOP : PANEL_HEIGHT_DESKTOP,
    maxHeight: "calc(100vh - 100px)",
    borderRadius: "1rem",
  };
}

export function SupportChatWidget() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [fabPosition, setFabPosition] = useState<FabPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originLeft: number;
    originTop: number;
  } | null>(null);
  const dragMovedRef = useRef(false);
  const rafDragRef = useRef<number | null>(null);
  const pendingFabRef = useRef<FabPosition | null>(null);

  useLayoutEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    try {
      const raw = localStorage.getItem(POSITION_STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { left?: unknown; top?: unknown };
        if (typeof p.left === "number" && typeof p.top === "number") {
          const clamped = clampFabPosition(p.left, p.top, vw, vh);
          setFabPosition(snapFabToNearestEdge(clamped, vw, vh));
          return;
        }
      }
    } catch {
      // ignore
    }
    setFabPosition(getDefaultFabPosition(vw, vh));
  }, []);

  useEffect(() => {
    const check = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setIsMobile(vw < MOBILE_BREAKPOINT);
      setFabPosition((prev) =>
        prev
          ? snapFabToNearestEdge(clampFabPosition(prev.left, prev.top, vw, vh), vw, vh)
          : getDefaultFabPosition(vw, vh),
      );
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(EXPANDED_STORAGE_KEY);
      if (saved === "true") setExpanded(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(EXPANDED_STORAGE_KEY, expanded ? "true" : "false");
    } catch {
      // ignore
    }
  }, [expanded]);

  const persistFabPosition = useCallback((pos: FabPosition) => {
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(pos));
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => setOpen((o) => !o);
  const close = () => {
    setOpen(false);
  };

  const handleFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);

    const rect = el.getBoundingClientRect();
    const originLeft = fabPosition?.left ?? rect.left;
    const originTop = fabPosition?.top ?? rect.top;

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originLeft,
      originTop,
    };
    dragMovedRef.current = false;
    setIsDragging(false);
  };

  const handleFabPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!dragMovedRef.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
      dragMovedRef.current = true;
      setIsDragging(true);
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const next = clampFabPosition(d.originLeft + dx, d.originTop + dy, vw, vh);
    pendingFabRef.current = next;
    if (rafDragRef.current == null) {
      rafDragRef.current = requestAnimationFrame(() => {
        rafDragRef.current = null;
        const p = pendingFabRef.current;
        if (p) setFabPosition(p);
      });
    }
  };

  const handleFabPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;

    if (rafDragRef.current != null) {
      cancelAnimationFrame(rafDragRef.current);
      rafDragRef.current = null;
    }
    const flushed = pendingFabRef.current;
    pendingFabRef.current = null;

    const el = e.currentTarget;
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    dragRef.current = null;

    if (dragMovedRef.current) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setFabPosition((prev) => {
        const raw = flushed ?? prev;
        if (!raw) return prev;
        const snapped = snapFabToNearestEdge(
          clampFabPosition(raw.left, raw.top, vw, vh),
          vw,
          vh,
        );
        persistFabPosition(snapped);
        return snapped;
      });
      setIsDragging(false);
      dragMovedRef.current = false;
      return;
    }

    dragMovedRef.current = false;
    setIsDragging(false);
    toggle();
  };

  const handleFabPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    if (rafDragRef.current != null) {
      cancelAnimationFrame(rafDragRef.current);
      rafDragRef.current = null;
    }
    const flushed = pendingFabRef.current;
    pendingFabRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    dragRef.current = null;
    if (dragMovedRef.current) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setFabPosition((prev) => {
        const raw = flushed ?? prev;
        if (!raw) return prev;
        const snapped = snapFabToNearestEdge(
          clampFabPosition(raw.left, raw.top, vw, vh),
          vw,
          vh,
        );
        persistFabPosition(snapped);
        return snapped;
      });
    }
    dragMovedRef.current = false;
    setIsDragging(false);
  };

  const fabStyle: CSSProperties | undefined =
    fabPosition != null
      ? {
          left: fabPosition.left,
          top: fabPosition.top,
          right: "auto",
          bottom: "auto",
          touchAction: "none",
        }
      : { right: 24, bottom: 24, left: "auto", top: "auto", touchAction: "none" };

  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;

  const desktopPanelStyle: CSSProperties =
    !isMobile && fabPosition != null
      ? getDesktopPanelStyle(fabPosition, vw, vh, expanded)
      : {
          bottom: 24,
          right: 24,
          width: expanded ? "min(90vw, 560px)" : PANEL_WIDTH,
          height: expanded ? PANEL_HEIGHT_EXPANDED_DESKTOP : PANEL_HEIGHT_DESKTOP,
          maxHeight: "calc(100vh - 100px)",
          borderRadius: "1rem",
        };

  return (
    <>
      {/* Floating action button (closed state) — draggable */}
      <button
        type="button"
        aria-label={
          open
            ? t("customer.support.widget.ariaClose")
            : t("customer.support.widget.ariaOpen")
        }
        aria-grabbed={isDragging}
        style={fabStyle}
        className={`fixed z-[9998] flex h-14 w-14 select-none items-center justify-center rounded-full bg-blue-700 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 ${
          isDragging
            ? "scale-105 cursor-grabbing"
            : "cursor-grab hover:scale-105 hover:bg-blue-600"
        }`}
        onPointerDown={handleFabPointerDown}
        onPointerMove={handleFabPointerMove}
        onPointerUp={handleFabPointerUp}
        onPointerCancel={handleFabPointerCancel}
      >
        <Bot className="pointer-events-none h-7 w-7" />
      </button>

      {/* Overlay on mobile when open */}
      {open && isMobile && (
        <div
          className="fixed inset-0 z-[9997] bg-blue-700/40"
          aria-hidden
          onClick={close}
        />
      )}

      {/* Chat panel - slide in from bottom-right */}
      <div
        id="support-chat-panel"
        role="dialog"
        aria-label={t("customer.support.widget.dialogLabel")}
        aria-hidden={!open}
        className="fixed z-[9999] flex flex-col rounded-t-2xl border bg-card shadow-xl transition-[transform,opacity,width,height,max-height,top] duration-300 ease-out"
        style={
          isMobile
            ? expanded
              ? {
                  bottom: 0,
                  left: 0,
                  right: 0,
                  top: 0,
                  maxHeight: "100dvh",
                  height: "100dvh",
                  borderRadius: 0,
                  transform: open ? "translateY(0)" : "translateY(100%)",
                  opacity: open ? 1 : 0,
                  pointerEvents: open ? "auto" : "none",
                }
              : {
                  bottom: 0,
                  left: 0,
                  right: 0,
                  top: "15%",
                  maxHeight: "85vh",
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  transform: open ? "translateY(0)" : "translateY(100%)",
                  opacity: open ? 1 : 0,
                  pointerEvents: open ? "auto" : "none",
                }
            : {
                ...desktopPanelStyle,
                transform: open
                  ? "translateY(0) scale(1)"
                  : "translateY(12px) scale(0.96)",
                opacity: open ? 1 : 0,
                pointerEvents: open ? "auto" : "none",
                visibility: open ? "visible" : "hidden",
              }
        }
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 rounded-t-2xl bg-gradient-to-br from-blue-700 to-blue-800 px-4 py-3 text-white">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">{t("customer.support.widget.title")}</p>
              <p className="flex items-center gap-1.5 text-xs opacity-95">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-green-400"
                  aria-hidden
                />
                {t("customer.support.widget.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              aria-label={
                expanded
                  ? t("customer.support.widget.ariaCollapse")
                  : t("customer.support.widget.ariaExpand")
              }
              aria-expanded={expanded}
              aria-controls="support-chat-panel"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <Minimize2 className="h-4 w-4" aria-hidden />
              ) : (
                <Maximize2 className="h-4 w-4" aria-hidden />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/20"
              aria-label={t("customer.support.widget.ariaMinimize")}
              onClick={close}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
          <SupportChatClient embedded />
        </div>
      </div>
    </>
  );
}
