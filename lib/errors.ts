/**
 * User-facing message for API/server errors. Shown in UI only; never expose technical details.
 */
export const USER_FRIENDLY_MESSAGE =
  "Something went wrong. Please try again in a few minutes.";

/**
 * Returns a safe message for the UI and logs the real error in development.
 * Use in catch blocks: set state to this result and pass it to FriendlyErrorState (or similar).
 */
export function getUserFriendlyErrorMessage(
  error: unknown,
  context?: string
): string {
  if (process.env.NODE_ENV === "development") {
    const label = context ? `[API Error] ${context}` : "[API Error]";
    const detail =
      error instanceof Error ? error.message : String(error);
    console.error(label, detail, error);
  }
  return USER_FRIENDLY_MESSAGE;
}
