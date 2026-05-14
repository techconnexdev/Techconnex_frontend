"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useI18n } from "@/contexts/I18nProvider";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const POLL_MS = 2000;
const MAX_POLLS = 45;

type PageStatus =
  | "loading"
  | "confirming"
  | "success"
  | "failed"
  | "error"
  | "pending";

export default function PaymentSuccess() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent");
    const redirectStatus = searchParams.get("redirect_status");

    if (!paymentIntent) {
      setStatus("error");
      return;
    }

    // Stripe appends redirect_status after redirect-based payment methods / 3DS
    if (redirectStatus === "failed") {
      setStatus("failed");
      return;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    const run = async () => {
      setStatus("confirming");
      for (let i = 0; i < MAX_POLLS; i++) {
        if (cancelled) return;
        try {
          const res = await fetch(
            `${API_BASE}/payments/verify-return?payment_intent=${encodeURIComponent(
              paymentIntent,
            )}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const data = await res.json();

          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              setStatus("error");
              return;
            }
            await new Promise((r) => setTimeout(r, POLL_MS));
            continue;
          }

          const st = data.data?.status as string | undefined;
          if (st === "ESCROWED") {
            if (data.data?.projectId) {
              setProjectId(data.data.projectId);
            }
            setStatus("success");
            return;
          }
          if (st === "FAILED") {
            setStatus("failed");
            return;
          }
        } catch {
          // network — retry
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
      if (!cancelled) {
        setStatus("pending");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (status === "loading" || status === "confirming") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {status === "loading"
              ? t("customer.payments.success.loading")
              : t("customer.payments.success.confirming")}
          </p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-red-600 text-6xl mb-4">✕</div>
          <h1 className="text-2xl font-bold mb-2">
            {t("customer.payments.success.errorTitle")}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("customer.payments.success.failedDesc")}
          </p>
          <Link
            href="/customer/projects"
            className="text-blue-600 hover:underline"
          >
            {t("customer.payments.success.backToProjects")}
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-red-600 text-6xl mb-4">✕</div>
          <h1 className="text-2xl font-bold mb-2">
            {t("customer.payments.success.errorTitle")}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("customer.payments.success.errorDesc")}
          </p>
          <Link
            href="/customer/projects"
            className="text-blue-600 hover:underline"
          >
            {t("customer.payments.success.backToProjects")}
          </Link>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-amber-600 text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-2">
            {t("customer.payments.success.pendingTitle")}
          </h1>
          <p className="text-gray-600 mb-6">
            {t("customer.payments.success.pendingConfirmation")}
          </p>
          <Link
            href="/customer/projects"
            className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700"
          >
            {t("customer.payments.success.backToProjects")}
          </Link>
        </div>
      </div>
    );
  }

  const projectHref = projectId
    ? `/customer/projects/${projectId}`
    : "/customer/projects";

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">
          {t("customer.payments.success.title")}
        </h1>
        <p className="text-gray-600 mb-6">
          {t("customer.payments.success.description")}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>{t("customer.payments.success.nextTitle")}</strong>
            <br />
            {t("customer.payments.success.nextBody")}
          </p>
        </div>
        <Link
          href={projectHref}
          className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700"
        >
          {t("customer.payments.success.viewProject")}
        </Link>
      </div>
    </div>
  );
}
