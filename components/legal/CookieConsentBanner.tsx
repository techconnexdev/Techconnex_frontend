"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";

const CONSENT_COOKIE_NAME = "techconnex_cookie_consent";
const CONSENT_COOKIE_MAX_AGE_DAYS = 365;

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = Cookies.get(CONSENT_COOKIE_NAME);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const setConsent = (value: "accepted" | "rejected") => {
    Cookies.set(CONSENT_COOKIE_NAME, value, {
      path: "/",
      expires: CONSENT_COOKIE_MAX_AGE_DAYS, // js-cookie expects expires in days (number)
      sameSite: "lax",
      secure: typeof window !== "undefined" && window.location?.protocol === "https:",
    });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="container mx-auto max-w-4xl">
        <div className="rounded-xl border border-blue-200/60 bg-white/95 p-4 shadow-lg backdrop-blur-sm dark:border-blue-800/40 dark:bg-gray-900/95 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
              <p className="mb-1 font-medium text-gray-900 dark:text-gray-100">
                We use cookies
              </p>
              <p>
                We use essential cookies for login, security, and interface
                preferences. We do not use advertising or tracking cookies.{" "}
                <Link
                  href="/cookies"
                  className="font-medium text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
                >
                  Cookie Notice
                </Link>
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConsent("rejected")}
                className="border-gray-300 dark:border-gray-600"
              >
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => setConsent("accepted")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Accept
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
