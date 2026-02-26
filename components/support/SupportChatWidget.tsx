"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bot, ChevronDown, MoreHorizontal } from "lucide-react";
import { SupportChatClient } from "./SupportChatClient";

const PANEL_WIDTH = 380;
const PANEL_HEIGHT_DESKTOP = 520;
const MOBILE_BREAKPOINT = 768;

export function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () =>
      setIsMobile(
        typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT,
      );
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggle = () => setOpen((o) => !o);
  const close = () => setOpen(false);

  return (
    <>
      {/* Floating action button (closed state) */}
      <button
        type="button"
        onClick={toggle}
        aria-label={open ? "Close chat" : "Open AI support chat"}
        className="fixed bottom-6 right-6 z-[9998] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <Bot className="h-7 w-7" />
      </button>

      {/* Overlay on mobile when open */}
      {open && isMobile && (
        <div
          className="fixed inset-0 z-[9997] bg-black/40"
          aria-hidden
          onClick={close}
        />
      )}

      {/* Chat panel - slide in from bottom-right */}
      <div
        role="dialog"
        aria-label="AI Support Chat"
        aria-hidden={!open}
        className="fixed z-[9999] flex flex-col rounded-t-2xl border bg-card shadow-xl transition-all duration-300 ease-out"
        style={
          isMobile
            ? {
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
                bottom: 24,
                right: 24,
                width: PANEL_WIDTH,
                height: PANEL_HEIGHT_DESKTOP,
                maxHeight: "calc(100vh - 100px)",
                borderRadius: "1rem",
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
        <div className="flex shrink-0 items-center justify-between gap-2 rounded-t-2xl bg-gradient-to-br from-primary/90 to-primary/70 px-4 py-3 text-primary-foreground">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">AI Support</p>
              <p className="flex items-center gap-1.5 text-xs opacity-95">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-green-400"
                  aria-hidden
                />
                We reply immediately
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-white/20"
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-white/20"
              aria-label="Minimize chat"
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
