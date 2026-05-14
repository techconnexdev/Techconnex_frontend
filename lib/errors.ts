/**
 * User-facing message for API/server errors. Shown in UI only; never expose technical details.
 */
export const USER_FRIENDLY_MESSAGE =
  "Something went wrong. Please try again in a few minutes.";

/**
 * Returns a safe message for the UI and logs the real error in development.
 * Use in catch blocks: set state to this result and pass it to FriendlyErrorState (or similar).
 */
function messageFromUnknown(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

/** Map known provider errors to safe copy users can act on. */
function mapKnownProviderErrors(message: string): string | null {
  const m = message.toLowerCase();
  if (
    m.includes("exceeded") &&
    (m.includes("daily messages limit") || m.includes("5 daily"))
  ) {
    return "WhatsApp codes are paused: your Twilio trial hit its daily limit (often 5 WhatsApp messages per day). Try again tomorrow, use email verification instead, or upgrade your Twilio account for higher limits.";
  }
  if (
    m.includes("could not find a channel with the specified from address") ||
    m.includes("twilio error 63007") ||
    m.includes("not a whatsapp sender on this account")
  ) {
    return "WhatsApp “From” is wrong for this Twilio account: use the WhatsApp Sandbox number in TWILIO_WHATSAPP_FROM for testing (Twilio Console → Messaging → Try WhatsApp, often whatsapp:+14155238886). Your SMS number only works after WhatsApp is enabled for that sender. Or use email verification.";
  }
  if (
    m.includes("description must be at least 10 characters long") ||
    m.includes("employee count must be between 1 and 1,000,000") ||
    m.includes("established year must be between 1800 and current year")
  ) {
    return "Please complete your company profile correctly: description must be at least 10 characters, employee count must be between 1 and 1,000,000, and established year must be between 1800 and the current year.";
  }
  if (
    m.includes("no account found with this phone number") ||
    m.includes("no account found with this phone")
  ) {
    return "No account was found for this phone number. Please register first or sign in with email.";
  }
  if (m.includes("whatsapp verification is not completed")) {
    return "This number is on an account, but WhatsApp verification is not finished yet. Please sign in with email or Google, then verify your phone number in your profile.";
  }
  if (m.includes("this phone number is already registered")) {
    return "This phone number is already linked to another account. Please use a different number.";
  }
  if (m.includes("this email is already registered")) {
    return "This email is already linked to another account. Please use a different email.";
  }
  if (m.includes("no current email found on your account")) {
    return "No current email is set on your account. Please contact support if you need help updating it.";
  }
  if (m.includes("no current phone number found on your account")) {
    return "No current phone number is set on your account. Add a phone number first, then you can update it.";
  }
  if (m.includes("current password is incorrect")) {
    return "Your current password is incorrect. Please try again.";
  }
  if (m.includes("google account does not match your current email")) {
    return "Please use the Google account that matches your current email.";
  }
  if (m.includes("before requesting another code")) {
    const waitMatch = message.match(/please wait\s+(\d+)s/i);
    const seconds = waitMatch?.[1];
    return seconds
      ? `Please wait ${seconds} seconds before requesting a new verification code.`
      : "Please wait a moment before requesting a new verification code.";
  }
  if (
    m.includes("invalid verification code") ||
    m.includes("invalid otp") ||
    m.includes("invalid code")
  ) {
    return "The verification code is incorrect. Please check the code and try again.";
  }
  if (m.includes("otp expired or not found")) {
    return "This verification code has expired. Please request a new code and try again.";
  }
  if (
    m.includes("phoneverified") &&
    (m.includes("does not exist") || m.includes("column"))
  ) {
    return "Phone sign-in is unavailable until the database is updated. Please sign in with email or Google for now. Your developer should run the latest migration (adds User.phoneVerified) on the server database, then restart the API.";
  }
  if (
    m.includes("can't reach database") ||
    m.includes("can\u2019t reach database") ||
    m.includes("cannot reach database") ||
    m.includes("reach database server") ||
    m.includes("failed to connect") ||
    m.includes("econnrefused") ||
    m.includes("connection timed out") ||
    m.includes("p1001") ||
    (m.includes("supabase") && m.includes("reach"))
  ) {
    return "We could not reach the server database right now. Check your internet connection, confirm the API is running, and verify your database URL (Supabase project running, correct password, VPN/firewall not blocking). Try again in a moment or sign in with email if the problem persists.";
  }
  return null;
}

export function getUserFriendlyErrorMessage(
  error: unknown,
  context?: string
): string {
  const detail = messageFromUnknown(error);
  const mapped = mapKnownProviderErrors(detail);
  if (process.env.NODE_ENV === "development") {
    const label = context ? `[API] ${context}` : "[API]";
    if (mapped) {
      // Expected provider limits / config — UI shows copy; avoid console.error (Next overlay).
      console.info(`${label} (handled)`, detail);
    } else {
      console.error(`${label} unexpected`, detail, error);
    }
  }
  if (mapped) return mapped;
  if (detail && detail !== "undefined" && detail !== "null") {
    return detail;
  }
  return USER_FRIENDLY_MESSAGE;
}
