"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { USER_FRIENDLY_MESSAGE } from "@/lib/errors";
import { cn } from "@/lib/utils";

type FriendlyErrorStateProps = {
  message?: string;
  onRetry?: () => void;
  variant?: "inline" | "block";
  className?: string;
};

export function FriendlyErrorState({
  message = USER_FRIENDLY_MESSAGE,
  onRetry,
  variant = "block",
  className,
}: FriendlyErrorStateProps) {
  const isInline = variant === "inline";

  return (
    <Alert
      variant="destructive"
      className={cn(
        isInline
          ? "py-3 px-4"
          : "py-6 sm:py-8 px-4 sm:px-6 flex flex-col items-center justify-center text-center [&>svg]:!static [&>svg]:!left-0 [&>svg]:!top-0 [&>svg]:mb-2 [&>svg~*]:!pl-0",
        className
      )}
    >
      <AlertCircle
        className={cn(
          "flex-shrink-0 text-destructive",
          isInline ? "h-4 w-4 sm:h-5 sm:w-5" : "h-8 w-8 sm:h-10 sm:w-10"
        )}
      />
      <AlertDescription
        className={cn(
          isInline ? "text-sm" : "text-base sm:text-lg"
        )}
      >
        {message}
      </AlertDescription>
      {onRetry && (
        <Button
          variant="outline"
          size={isInline ? "sm" : "default"}
          className={cn(
            "mt-3 border-destructive/50 text-destructive hover:bg-destructive/10",
            !isInline && "self-center"
          )}
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </Alert>
  );
}
