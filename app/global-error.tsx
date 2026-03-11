"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

const FRIENDLY_500_MESSAGE = "Our server is experiencing an issue. Our team has been notified. Please try again in a few minutes.";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f5f5f5" }}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "400px" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ color: "#666" }}>{FRIENDLY_500_MESSAGE}</p>
        </div>
      </body>
    </html>
  );
}
