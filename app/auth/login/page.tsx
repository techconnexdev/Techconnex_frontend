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

                  {/* <div className="flex items-center justify-between text-sm">
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
                  </div> */}

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
      <motion.div
        className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Zap className="w-6 h-6 text-white" />
      </motion.div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        TechConnex
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
