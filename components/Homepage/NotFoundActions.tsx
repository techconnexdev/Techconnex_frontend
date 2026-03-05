"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NotFoundActions() {
  const router = useRouter();

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window === "undefined") {
      router.push("/");
      return;
    }
    const userJson = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userJson || !token) {
      router.push("/");
      return;
    }

    try {
      const userData = JSON.parse(userJson);
      const roles = Array.isArray(userData?.role) ? userData.role : userData?.role ? [userData.role] : [];

      if (roles.includes("ADMIN")) {
        router.push("/admin/dashboard");
      } else if (roles.includes("PROVIDER")) {
        router.push("/provider/dashboard");
      } else if (roles.includes("CUSTOMER")) {
        router.push("/customer/dashboard");
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-center gap-4">
      <Button size="lg" onClick={handleBackClick}>
        Back on Track
      </Button>
    </div>
  );
}
