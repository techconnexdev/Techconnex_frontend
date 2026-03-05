import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN ?? "https://a037c86733daed4cb3742dbe9c6f6f1f@o4510990701297664.ingest.de.sentry.io/4510990819655765",
  environment: process.env.NODE_ENV ?? "development",
  sendDefaultPii: true,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
