"use client";

import { useState } from "react";
import { Languages, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { translateMessagesBatch } from "@/lib/messageTranslate";
import { cn } from "@/lib/utils";

export type TranslatedMessageTextProps = {
  messageId: string;
  content: string;
  isOwn: boolean;
  /** UI locale (en | id | ar) — matches Settings / I18nProvider */
  targetLocale: string;
  token: string | null | undefined;
  translateLabel: string;
  translatingLabel: string;
  className?: string;
  /** Replace bubble text with translated string (local state only). */
  onContentReplaced: (messageId: string, newContent: string) => void;
  /** Called with API/network error message when translation fails */
  onTranslateFailed?: (reason?: string) => void;
};

export function TranslatedMessageText({
  messageId,
  content,
  isOwn,
  targetLocale,
  token,
  translateLabel,
  translatingLabel,
  className,
  onContentReplaced,
  onTranslateFailed,
}: TranslatedMessageTextProps) {
  const [loading, setLoading] = useState(false);

  const handleManualTranslate = async () => {
    const trimmed = String(content ?? "").trim();
    if (!token || !trimmed || loading) return;
    setLoading(true);
    try {
      const map = await translateMessagesBatch(
        token,
        [{ id: messageId, content }],
        targetLocale,
      );
      const tr = map.get(messageId);
      if (tr != null && String(tr).trim()) {
        onContentReplaced(messageId, String(tr).trim());
      } else {
        onTranslateFailed?.(
          "No translation was returned. Check OPENAI_API_KEY, model name, and OpenAI account quota.",
        );
      }
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : "Translation failed";
      onTranslateFailed?.(reason);
    } finally {
      setLoading(false);
    }
  };

  const btnClass = isOwn
    ? "h-7 w-7 text-blue-100 hover:bg-white/10 hover:text-white"
    : "h-7 w-7 text-gray-500 hover:bg-gray-200/80 hover:text-gray-900";

  return (
    <div className={cn("group/msg relative min-w-0 max-w-full", className)}>
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/msg:opacity-100",
                  btnClass,
                )}
                disabled={loading || !String(content ?? "").trim() || !token}
                onClick={() => void handleManualTranslate()}
                aria-label={translateLabel}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Languages className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{loading ? translatingLabel : translateLabel}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
