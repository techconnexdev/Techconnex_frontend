"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building,
  Briefcase,
  CheckCircle,
  Globe,
  Upload,
  User,
  Users,
  Zap,
} from "lucide-react";
import Cookies from "js-cookie";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { useI18n } from "@/contexts/I18nProvider";
import { isLocale } from "@/lib/i18n/locales";

const GOOGLE_PENDING_TOKEN_KEY = "google_oauth_pending_id_token";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

export default function JoinGooglePage() {
  const { t, setLocale } = useI18n();
  const router = useRouter();
  const [userRole, setUserRole] = useState<"" | "customer" | "provider">("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = sessionStorage.getItem(GOOGLE_PENDING_TOKEN_KEY);
    if (!token?.trim()) {
      router.replace("/auth/login");
    }
  }, [router]);

  const handleContinue = async () => {
    if (!userRole) return;
    const idToken = sessionStorage.getItem(GOOGLE_PENDING_TOKEN_KEY);
    if (!idToken?.trim()) {
      setError(t("auth.joinGoogle.sessionExpired"));
      router.replace("/auth/login");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          role: userRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || data.error || t("auth.joinGoogle.completeRegistrationFailed"),
        );
      }
      if (data.needsRegistration) {
        throw new Error(t("auth.joinGoogle.googleSessionExpired"));
      }
      if (!data.token || !data.user) {
        throw new Error(data.message || t("auth.joinGoogle.noSessionReturned"));
      }
      sessionStorage.removeItem(GOOGLE_PENDING_TOKEN_KEY);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      const u = data.user as { settings?: { locale?: string } };
      if (u?.settings?.locale && isLocale(u.settings.locale)) {
        setLocale(u.settings.locale);
      }
      Cookies.set("token", data.token, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      const roles: string[] = data.user?.role || [];
      if (roles.includes("CUSTOMER")) {
        router.push("/customer/onboarding");
      } else if (roles.includes("PROVIDER")) {
        router.push("/provider/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      setError(getUserFriendlyErrorMessage(e, "auth join google"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"
          animate={{ rotate: -360 }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </div>

      <motion.div
        className="w-full max-w-2xl relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="text-center mb-4 sm:mb-5"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <Image
              src="/logo.png"
              alt={t("auth.logoAlt")}
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-contain"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t("auth.brandName")}
            </span>
          </Link>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="text-center space-y-1 px-4 pt-4 pb-2 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                {t("auth.register.joinTitle")}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {t("auth.register.joinSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <Alert className="mb-4 border-blue-200 bg-blue-50/80 text-left py-3 px-3">
                <AlertTitle className="text-blue-900 text-sm font-semibold">
                  {t("auth.joinGoogle.alertTitle")}
                </AlertTitle>
                <AlertDescription className="text-blue-800/90 text-xs sm:text-sm leading-snug mt-1">
                  {t("auth.joinGoogle.alertBody")}
                </AlertDescription>
              </Alert>

              {error && (
                <p className="mb-3 text-xs sm:text-sm text-red-600 text-center" role="alert">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className={`cursor-pointer transition-all duration-300 h-full ${
                      userRole === "customer"
                        ? "ring-2 ring-blue-500 bg-blue-50/50 border-blue-300"
                        : "hover:bg-blue-50/30 hover:border-blue-300 border-gray-200"
                    }`}
                    onClick={() => setUserRole("customer")}
                  >
                    <CardContent className="p-4 sm:p-5 text-center h-full flex flex-col justify-between gap-3">
                      <div>
                        <div className="mb-3">
                          <Building className="w-11 h-11 mx-auto text-blue-600" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900">
                          {t("auth.register.hireTitle")}
                        </h3>
                        <p className="text-gray-600 mb-3 text-xs sm:text-sm leading-snug">
                          {t("auth.register.hireDesc")}
                        </p>
                        <div className="space-y-1.5 mb-0">
                          <div className="flex items-center text-xs text-gray-600">
                            <Users className="w-3.5 h-3.5 mr-2 shrink-0 text-blue-500" />
                            <span>{t("auth.register.hireFeature1")}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Briefcase className="w-3.5 h-3.5 mr-2 shrink-0 text-blue-500" />
                            <span>{t("auth.register.hireFeature2")}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <CheckCircle className="w-3.5 h-3.5 mr-2 shrink-0 text-blue-500" />
                            <span>{t("auth.register.hireFeature3")}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          userRole === "customer"
                            ? "bg-blue-100 text-blue-700 border-blue-300 text-xs"
                            : "bg-blue-50 text-blue-600 border-blue-200 text-xs"
                        }
                      >
                        {t("auth.register.hireBadge")}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className={`cursor-pointer transition-all duration-300 h-full ${
                      userRole === "provider"
                        ? "ring-2 ring-purple-500 bg-purple-50/50 border-purple-300"
                        : "hover:bg-purple-50/30 hover:border-purple-300 border-gray-200"
                    }`}
                    onClick={() => setUserRole("provider")}
                  >
                    <CardContent className="p-4 sm:p-5 text-center h-full flex flex-col justify-between gap-3">
                      <div>
                        <div className="mb-3">
                          <User className="w-11 h-11 mx-auto text-purple-600" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900">
                          {t("auth.register.workTitle")}
                        </h3>
                        <p className="text-gray-600 mb-3 text-xs sm:text-sm leading-snug">
                          {t("auth.register.workDesc")}
                        </p>
                        <div className="space-y-1.5 mb-0">
                          <div className="flex items-center text-xs text-gray-600">
                            <Zap className="w-3.5 h-3.5 mr-2 shrink-0 text-purple-500" />
                            <span>{t("auth.register.workFeature1")}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Upload className="w-3.5 h-3.5 mr-2 shrink-0 text-purple-500" />
                            <span>{t("auth.register.workFeature2")}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Globe className="w-3.5 h-3.5 mr-2 shrink-0 text-purple-500" />
                            <span>{t("auth.register.workFeature3")}</span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          userRole === "provider"
                            ? "bg-purple-100 text-purple-700 border-purple-300 text-xs"
                            : "bg-purple-50 text-purple-600 border-purple-200 text-xs"
                        }
                      >
                        {t("auth.register.workBadge")}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <div className="mt-5 text-center">
                <Button
                  onClick={handleContinue}
                  disabled={!userRole || isLoading}
                  size="default"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 h-auto text-sm sm:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    t("auth.joinGoogle.creatingAccount")
                  ) : (
                    <>
                      {t("auth.register.continueAs")}{" "}
                      {userRole === "customer"
                        ? t("auth.register.roleCompany")
                        : userRole === "provider"
                          ? t("auth.register.roleFreelancer")
                          : t("auth.register.roleEllipsis")}
                      <ArrowRight className="w-4 h-4 ml-1.5 inline align-middle" />
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs sm:text-sm text-gray-600">
                  {t("auth.register.hasAccount")}{" "}
                  <Link
                    href="/auth/login"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {t("auth.register.signInHere")}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
