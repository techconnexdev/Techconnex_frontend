"use client";

import React, { useState, useEffect } from "react";
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
import { Mail, Lock, Eye, EyeOff, Building, User, HelpCircle, Mail as MailIcon, Phone } from "lucide-react";
import Cookies from "js-cookie";
import Image from "next/image";
import { getUserFriendlyErrorMessage } from "@/lib/errors";

/** User-facing auth messages we show as-is (e.g. suspended, invalid credentials, wrong password). */
function isUserFacingAuthError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("suspended") ||
    m.includes("contact support") ||
    m.includes("invalid credentials") ||
    m.includes("account was deleted") ||
    m.includes("email or password") ||
    m.includes("password is incorrect") ||
    m.includes("incorrect. try again")
  );
}

function isSuspendedError(message: string): boolean {
  return message.toLowerCase().includes("suspended") || message.toLowerCase().includes("contact support");
}

type GoogleAccountsId = {
  initialize: (config: { client_id: string; callback: (response: { credential?: string }) => void }) => void;
  renderButton: (el: HTMLElement, opts: { type?: string; theme?: string; size?: string; text?: string; width?: number }) => void;
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const suspended = url.searchParams.get("suspended");

    if (suspended === "1") {
      setError(
        "Your account has been suspended. Please contact TechConnect support—we're here to help."
      );

      // Clean up the URL so the message is only shown once
      url.searchParams.delete("suspended");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const handleGoogleCredential = (idToken: string) => {
    setError("");
    setIsLoading(true);
    fetch(`${API_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.token || !data.user) throw new Error(data.message || data.error || "Google sign-in failed");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
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
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        setError(isUserFacingAuthError(msg) ? msg : getUserFriendlyErrorMessage(err, "auth login google"));
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const container = document.getElementById("google-login-button-container");
    if (!container) return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      container.innerHTML = "";
      return;
    }
    const initGoogle = () => {
      const win = window as unknown as { google?: { accounts?: { id?: GoogleAccountsId } } };
      const g = win.google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response?.credential) handleGoogleCredential(response.credential);
        },
      });
      container.innerHTML = "";
      g.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 320,
      });
    };
    const win = window as unknown as { google?: { accounts?: { id?: GoogleAccountsId } } };
    if (win.google?.accounts?.id) {
      initGoogle();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
    return () => {
      container.innerHTML = "";
    };
  }, []);

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
        let errorMessage = "Login failed";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // ✅ Save token to both localStorage and cookies
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      Cookies.set("token", data.token, {
        path: "/",
        secure: true,
        sameSite: "lax",
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const roles: string[] = data.user?.role || [];
      if (roles.includes("CUSTOMER")) {
        router.push("/customer/dashboard");
      } else if (roles.includes("PROVIDER")) {
        router.push("/provider/dashboard");
      } else if (roles.includes("ADMIN")) {
        router.push("/admin/dashboard");
      } else {
        setError("Invalid user role");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(isUserFacingAuthError(msg) ? msg : getUserFriendlyErrorMessage(err, "auth login"));
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
        <LogoSection />

        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-600">
              Sign in to your TechConnex account
            </CardDescription>
            <QuickBadges />
          </CardHeader>
          <CardContent>
            {error && (isSuspendedError(error) ? (
              <SuspendedMessage />
            ) : (
              <ErrorMessage message={error} />
            ))}
            <div id="google-login-button-container" className="flex justify-center min-h-[44px] mb-4" />
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or sign in with email</span>
              </div>
            </div>
            <Tabs defaultValue="email" className="w-full">
              <TabsContent value="email">
                <form onSubmit={handleLogin} className="space-y-4">
                  <InputField
                    label="Email Address"
                    id="email"
                    type="email"
                    icon={<Mail />}
                    placeholder="Enter your email"
                  />
                  <InputField
                    label="Password"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    icon={<Lock />}
                    placeholder="Enter your password"
                    showPassword={showPassword}
                    togglePassword={() => setShowPassword(!showPassword)}
                  />

                  <div className="flex items-center justify-end text-sm">
                    <Link
                      href="/auth/forgot-password"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Forgot password?
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
                      {isLoading ? <LoadingSpinner /> : "Sign In"}
                    </Button>
                  </motion.div>
                </form>
              </TabsContent>
            </Tabs>

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

const LogoSection = () => (
  <motion.div
    className="text-center mb-8"
    variants={fadeInUp}
    initial="initial"
    animate="animate"
  >
    <Link href="/" className="inline-flex items-center space-x-2 group">
      <Image
        src="/logo.png"
        alt="TechConnex"
        width={40}
        height={40}
        className="h-10 w-10 rounded-xl object-contain"
      />
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Techconnex
      </span>
    </Link>
  </motion.div>
);

const QuickBadges = () => (
  <div className="flex justify-center gap-2 mt-4">
    <Badge
      variant="outline"
      className="bg-blue-50 text-blue-700 border-blue-200"
    >
      <Building className="w-3 h-3 mr-1" /> Companies
    </Badge>
    <Badge
      variant="outline"
      className="bg-purple-50 text-purple-700 border-purple-200"
    >
      <User className="w-3 h-3 mr-1" /> Freelancers
    </Badge>
  </div>
);

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
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-3 text-gray-400">{icon}</span>
      )}
      <Input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        className="pl-10 pr-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        required
      />
      {togglePassword && (
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
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

const SuspendedMessage = () => (
  <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50/80 p-4 shadow-sm">
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100">
        <HelpCircle className="h-5 w-5 text-sky-600" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-medium text-sky-900">We're here to help</p>
        <p className="text-sm leading-relaxed text-sky-800">
          Your account access is currently Suspended. We'd be happy to help—please reach out and we'll get things sorted.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-white/70 px-3 py-2 text-xs text-sky-700">
          <span className="flex items-center gap-1.5">
            <MailIcon className="h-3.5 w-3.5" />
            <a href={`mailto:${SUPPORT_EMAIL}`} className="underline hover:text-sky-900">{SUPPORT_EMAIL}</a>
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" />
            <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`} className="underline hover:text-sky-900">{SUPPORT_PHONE}</a>
          </span>
        </div>
      </div>
    </div>
  </div>
);

const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mx-auto"
  />
);

const SignUpLink = () => (
  <div className="mt-6 text-center">
    <p className="text-sm text-gray-600">
      Don&apos;t have an account?{" "}
      <Link
        href="/auth/register"
        className="text-blue-600 hover:text-blue-700 font-medium"
      >
        Sign up here
      </Link>
    </p>
  </div>
);
