"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserFriendlyErrorMessage } from "@/lib/errors";

/**
 * Redirects to role-based dashboard if logged in, otherwise to login.
 */
export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const userJson = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userJson || !token) {
      router.replace("/auth/login");
      return;
    }

    try {
      const userData = JSON.parse(userJson);
      const roles = Array.isArray(userData?.role)
        ? userData.role
        : userData?.role
          ? [userData.role]
          : [];

      if (roles.includes("ADMIN")) {
        router.replace("/admin/dashboard");
      } else if (roles.includes("PROVIDER")) {
        router.replace("/provider/dashboard");
      } else if (roles.includes("CUSTOMER")) {
        router.replace("/customer/dashboard");
      } else {
        router.replace("/auth/login");
      }
    } catch (err) {
      getUserFriendlyErrorMessage(err, "dashboard redirect parse user");
      router.replace("/auth/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to dashboard...</p>
    </div>
  );
}
