"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building,
  User,
  HelpCircle,
  Mail as MailIcon,
  Phone,
} from "lucide-react";
import Cookies from "js-cookie";
import Image from "next/image";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { useI18n } from "@/contexts/I18nProvider";
import { LanguageSwitcher } from "@/components/Homepage/LanguageSwitcher";
import { isLocale } from "@/lib/i18n/locales";
import { PhoneInputField } from "../register/components/PhoneInputField";

function isUserFacingAuthError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("suspended") ||
    m.includes("contact support") ||
    m.includes("invalid credentials") ||
    m.includes("account was deleted") ||
    m.includes("email or password") ||
    m.includes("password is incorrect") ||
    m.includes("incorrect. try again") ||
    m.includes("whatsapp verification is not completed") ||
    m.includes("created via google")
  );
}

function isGoogleAccountError(message: string): boolean {
  return message.toLowerCase().includes("created via google");
}

function isSuspendedError(message: string): boolean {
  return (
    message.toLowerCase().includes("suspended") ||
    message.toLowerCase().includes("contact support")
  );
}

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }) => void;
  renderButton: (
    el: HTMLElement,
    opts: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      width?: number;
      shape?: string;
    },
  ) => void;
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

export default function LoginPage() {
  const { t, setLocale } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneMode, setPhoneMode] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const googleButtonContainerRef = useRef<HTMLDivElement>(null);

  const completeLogin = useCallback(
    (data: {
      token: string;
      user: { role?: string[]; settings?: { locale?: string } };
    }) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user?.settings?.locale && isLocale(data.user.settings.locale)) {
        setLocale(data.user.settings.locale);
      }
      Cookies.set("token", data.token, {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      const roles: string[] = data.user?.role || [];
      if (roles.includes("CUSTOMER")) router.push("/customer/dashboard");
      else if (roles.includes("PROVIDER")) router.push("/provider/dashboard");
      else if (roles.includes("ADMIN")) router.push("/admin/dashboard");
      else router.push("/dashboard");
    },
    [router, setLocale],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const suspended = url.searchParams.get("suspended");

    if (suspended === "1") {
      setError(t("auth.login.suspendedUrlMessage"));

      // Clean up the URL so the message is only shown once
      url.searchParams.delete("suspended");
      window.history.replaceState({}, "", url.toString());
    }
  }, [t]);

  const handleGoogleCredential = useCallback(
    (idToken: string) => {
      setError("");
      setIsLoading(true);
      fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(
              data.message || data.error || t("auth.login.error.googleSignIn"),
            );
          }
          if (data.needsRegistration) {
            try {
              sessionStorage.setItem("google_oauth_pending_id_token", idToken);
            } catch {
              // ignore storage errors
            }
            router.push("/auth/join-google");
            return;
          }
          if (!data.token || !data.user) {
            throw new Error(
              data.message || data.error || t("auth.login.error.googleSignIn"),
            );
          }
          completeLogin(data);
        })
        .catch((err) => {
          const msg = err instanceof Error ? err.message : String(err);
          setError(
            isUserFacingAuthError(msg)
              ? msg
              : getUserFriendlyErrorMessage(err, "auth login google"),
          );
        })
        .finally(() => setIsLoading(false));
    },
    [API_URL, completeLogin, router, t],
  );

  useEffect(() => {
    const container = googleButtonContainerRef.current;
    if (!container) return undefined;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      container.innerHTML = "";
      return undefined;
    }

    const paintGoogleButton = () => {
      const win = window as unknown as {
        google?: { accounts?: { id?: GoogleAccountsId } };
      };
      const g = win.google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response?.credential) handleGoogleCredential(response.credential);
        },
      });
      container.innerHTML = "";
      const rawWidth = container.getBoundingClientRect().width;
      const widthPx = Math.max(240, Math.min(Math.floor(rawWidth) || 360, 520));
      g.accounts.id.renderButton(container, {
        type: "standard",
        theme: "filled_blue",
        size: "large",
        text: "continue_with",
        width: widthPx,
        shape: "rectangular",
      });
    };

    const initGoogle = () => {
      requestAnimationFrame(() => paintGoogleButton());
    };

    const win = window as unknown as {
      google?: { accounts?: { id?: GoogleAccountsId } };
    };
    if (win.google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = null;
        paintGoogleButton();
      }, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      container.innerHTML = "";
    };
  }, [handleGoogleCredential]);

  const sendPhoneLoginOtp = async () => {
    const phone = phoneNumber.trim();
    if (!phone) {
      setError(t("auth.login.error.phoneRequired"));
      return;
    }
    setError("");
    setPhoneOtpLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-login-whatsapp-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || t("auth.login.error.sendLoginCode"));
      setPhoneOtpSent(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        isUserFacingAuthError(msg)
          ? msg
          : getUserFriendlyErrorMessage(err, "auth login phone send"),
      );
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const verifyPhoneLoginOtp = async () => {
    const phone = phoneNumber.trim();
    const otp = phoneOtp.trim();
    if (!phone) {
      setError(t("auth.login.error.phoneRequired"));
      return;
    }
    if (otp.length !== 6) {
      setError(t("auth.login.error.otpSixDigits"));
      return;
    }
    setError("");
    setPhoneOtpLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-login-whatsapp-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.error || t("auth.login.error.verificationFailed"),
        );
      completeLogin(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        isUserFacingAuthError(msg)
          ? msg
          : getUserFriendlyErrorMessage(err, "auth login phone verify"),
      );
    } finally {
      setPhoneOtpLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      ?.value;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = t("auth.login.error.loginFailed");
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = t("auth.login.error.serverError", {
            status: String(res.status),
            statusText: res.statusText,
          });
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      completeLogin(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        isUserFacingAuthError(msg)
          ? msg
          : getUserFriendlyErrorMessage(err, "auth login"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <LogoSection />

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader className="text-center px-6 sm:px-8">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {t("auth.login.title")}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {t("auth.login.subtitle")}
            </CardDescription>
            <QuickBadges />
          </CardHeader>
          <CardContent className="px-6 sm:px-8">
            {error &&
              (isSuspendedError(error) ? (
                <SuspendedMessage />
              ) : isGoogleAccountError(error) ? (
                <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  <p className="font-medium">{error}</p>
                  <Link
                    href="/auth/forgot-password"
                    className="mt-1 inline-block underline hover:text-blue-900"
                  >
                    Set a password via Forgot Password →
                  </Link>
                </div>
              ) : (
                <ErrorMessage message={error} />
              ))}
            <div className="flex w-full flex-col gap-3 mb-5">
              <div
                ref={googleButtonContainerRef}
                className="gsi-material-button-host flex min-h-[44px] w-full items-center justify-center rounded-md border border-blue-100 bg-blue-50/40 px-1 [&>div]:w-full [&_iframe]:max-w-full"
              />
              <Button
                type="button"
                variant="outline"
                className="relative h-[44px] w-full gap-0 rounded-md border border-gray-200 bg-white font-medium text-gray-700 shadow-none hover:bg-gray-50 hover:text-gray-900 [&_svg]:!h-[18px] [&_svg]:!w-[18px]"
                onClick={() => {
                  setPhoneMode((prev) => !prev);
                  setError("");
                  setPhoneOtp("");
                  setPhoneOtpSent(false);
                }}
                disabled={isLoading || phoneOtpLoading}
              >
                <span
                  className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center"
                  aria-hidden
                >
                  <WhatsAppIcon />
                </span>
                <span className="pointer-events-none block w-full text-center text-sm sm:text-[15px]">
                  {t("auth.login.continueWithPhone")}
                </span>
              </Button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  {phoneMode
                    ? t("auth.login.orEmailShort")
                    : t("auth.login.orEmail")}
                </span>
              </div>
            </div>

            {phoneMode ? (
              <div className="space-y-4 rounded-xl border border-green-100 bg-green-50/40 p-4">
                <PhoneInputField
                  id="phone-login"
                  label={t("auth.fields.phoneLabel")}
                  value={phoneNumber}
                  onChange={(value) => {
                    setPhoneNumber(value);
                    setPhoneOtpSent(false);
                  }}
                  placeholder={t("auth.fields.phonePlaceholder")}
                  required
                />
                <div className="space-y-2">
                  <Label htmlFor="phone-otp">
                    {t("auth.login.whatsappCodeLabel")}
                  </Label>
                  {phoneOtpSent && (
                    <p className="text-xs text-green-700">
                      {t("auth.login.otpSentToWhatsApp")}
                    </p>
                  )}
                  <Input
                    id="phone-otp"
                    name="phone-otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={phoneOtp}
                    onChange={(e) =>
                      setPhoneOtp(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder={t("auth.login.otpPlaceholder")}
                    className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    disabled={!phoneOtpSent}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sendPhoneLoginOtp}
                    disabled={phoneOtpLoading || !phoneNumber.trim()}
                    className="flex-1 border-green-300 text-green-700 hover:bg-green-100"
                  >
                    {phoneOtpLoading
                      ? t("auth.login.sendingShort")
                      : phoneOtpSent
                        ? t("auth.login.resendCode")
                        : t("auth.login.sendCode")}
                  </Button>
                  <Button
                    type="button"
                    onClick={verifyPhoneLoginOtp}
                    disabled={phoneOtpLoading || phoneOtp.trim().length !== 6}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {phoneOtpLoading
                      ? t("auth.login.verifyingShort")
                      : t("auth.login.verifyAndLogin")}
                  </Button>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="email" className="w-full">
                <TabsContent
                  value="email"
                  className="mt-2 w-full focus-visible:outline-none"
                >
                  <form
                    onSubmit={handleLogin}
                    className="mx-auto w-full max-w-sm space-y-4"
                  >
                    <InputField
                      label={t("auth.login.emailLabel")}
                      id="email"
                      type="email"
                      icon={<Mail />}
                      placeholder={t("auth.login.emailPlaceholder")}
                    />
                    <InputField
                      label={t("auth.login.passwordLabel")}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      icon={<Lock />}
                      placeholder={t("auth.login.passwordPlaceholder")}
                      showPassword={showPassword}
                      togglePassword={() => setShowPassword(!showPassword)}
                    />

                    <div className="flex w-full items-center justify-end text-sm">
                      <Link
                        href="/auth/forgot-password"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {t("auth.login.forgotPassword")}
                      </Link>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <LoadingSpinner />
                        ) : (
                          t("auth.login.submit")
                        )}
                      </Button>
                    </motion.div>
                  </form>
                </TabsContent>
              </Tabs>
            )}

            {/* <SocialLoginSection /> */}
            <SignUpLink />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ======= Reusable Components =======
const AnimatedBackground = () => (
  <>
    <motion.div
      className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"
      animate={{ rotate: -360 }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
    />
  </>
);

const LogoSection = () => {
  const { t } = useI18n();
  return (
    <motion.div
      className="text-center mb-8"
      variants={fadeInUp}
      initial="initial"
      animate="animate"
    >
      <Link href="/" className="inline-flex items-center space-x-2 group">
        <Image
          src="/logo.png"
          alt={t("auth.logoAlt")}
          width={40}
          height={40}
          className="h-10 w-10 rounded-xl object-contain"
        />
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t("auth.brandName")}
        </span>
      </Link>
    </motion.div>
  );
};

const QuickBadges = () => {
  const { t } = useI18n();
  return (
    <div className="flex justify-center gap-2 mt-4">
      <Badge
        variant="outline"
        className="bg-blue-50 text-blue-700 border-blue-200"
      >
        <Building className="w-3 h-3 me-1" /> {t("auth.login.badgeCompanies")}
      </Badge>
      <Badge
        variant="outline"
        className="bg-purple-50 text-purple-700 border-purple-200"
      >
        <User className="w-3 h-3 me-1" /> {t("auth.login.badgeFreelancers")}
      </Badge>
    </div>
  );
};

const InputField = ({
  label,
  id,
  type,
  icon,
  placeholder,
  showPassword,
  togglePassword,
}: {
  label: string;
  id: string;
  type: string;
  icon: React.ReactNode;
  placeholder: string;
  showPassword?: boolean;
  togglePassword?: () => void;
}) => (
  <div className="w-full space-y-2">
    <Label htmlFor={id} className="block w-full text-left">
      {label}
    </Label>
    <div className="relative w-full">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-gray-400">
          {icon}
        </span>
      )}
      <Input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        required
      />
      {togglePassword && (
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-red-600 text-sm">{message}</p>
  </div>
);

const SUPPORT_EMAIL = "support@techconnect.my";
const SUPPORT_PHONE = "+60312345678";

const SuspendedMessage = () => {
  const { t } = useI18n();
  return (
    <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50/80 p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100">
          <HelpCircle className="h-5 w-5 text-sky-600" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-sky-900">
            {t("auth.login.suspendedHelpTitle")}
          </p>
          <p className="text-sm leading-relaxed text-sky-800">
            {t("auth.login.suspendedHelpBody")}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-white/70 px-3 py-2 text-xs text-sky-700">
            <span className="flex items-center gap-1.5">
              <MailIcon className="h-3.5 w-3.5" />
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="underline hover:text-sky-900"
              >
                {SUPPORT_EMAIL}
              </a>
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              <a
                href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
                className="underline hover:text-sky-900"
              >
                {SUPPORT_PHONE}
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mx-auto"
  />
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    className={className}
  >
    <path
      fill="#25D366"
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
    />
  </svg>
);

const SignUpLink = () => {
  const { t } = useI18n();
  return (
    <div className="mt-6 text-center">
      <p className="text-sm text-gray-600">
        {t("auth.login.signUpPrompt")}{" "}
        <Link
          href="/auth/register"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {t("auth.login.signUpLink")}
        </Link>
      </p>
    </div>
  );
};
