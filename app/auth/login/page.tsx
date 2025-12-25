"use client";

import React, { useState } from "react";
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
import { Zap, Mail, Lock, Eye, EyeOff, Building, User } from "lucide-react";
import Cookies from "js-cookie"; // install via `npm i js-cookie`

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
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6 relative">
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
              Sign in to your TechConnect account
            </CardDescription>
            <QuickBadges />
          </CardHeader>
          <CardContent>
            {error && <ErrorMessage message={error} />}
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

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2 text-gray-600">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                      />
                      <span>Remember me</span>
                    </label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-blue-600 hover:text-blue-700"
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

            <SocialLoginSection />
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
      <motion.div
        className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Zap className="w-6 h-6 text-white" />
      </motion.div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        TechConnect
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

const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mx-auto"
  />
);

const SocialLoginSection = () => (
  <div className="mt-6">
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-white text-gray-500">Or continue with</span>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      {/* Google Button */}
      <Button variant="outline" className="bg-white/50 hover:bg-white/80">
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Google
      </Button>

      {/* Facebook Button */}
      <Button variant="outline" className="bg-white/50 hover:bg-white/80">
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        Facebook
      </Button>
    </div>
  </div>
);

const SignUpLink = () => (
  <div className="mt-6 text-center">
    <p className="text-sm text-gray-600">
      Don&apos;t have an account?{" "}
      <Link
        href="/auth/signup"
        className="text-blue-600 hover:text-blue-700 font-medium"
      >
        Sign up here
      </Link>
    </p>
  </div>
);
