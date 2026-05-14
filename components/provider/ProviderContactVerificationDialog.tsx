"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyErrorMessage } from "@/lib/errors";

export type ContactVerifyNeeds = {
  emailCurrent: boolean;
  emailNew: boolean;
  phoneCurrent: boolean;
  phoneNew: boolean;
};

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
    },
  ) => void;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  needs: ContactVerifyNeeds;
  contactSnapshot: { email: string; phone: string };
  draftEmail: string;
  draftPhone: string;
  /** Full base URL without trailing slash, e.g. `${API_BASE}/provider/profile` */
  apiBase: string;
  onContinueSave: () => Promise<void>;
};

export function ProviderContactVerificationDialog({
  open,
  onOpenChange,
  needs,
  contactSnapshot,
  draftEmail,
  draftPhone,
  apiBase,
  onContinueSave,
}: Props) {
  const { toast } = useToast();

  const [emailVerifiedForChange, setEmailVerifiedForChange] = useState(false);
  const [emailNewVerifiedForChange, setEmailNewVerifiedForChange] =
    useState(false);
  const [phoneVerifiedForChange, setPhoneVerifiedForChange] = useState(false);
  const [phoneNewVerifiedForChange, setPhoneNewVerifiedForChange] =
    useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailNewOtpSent, setEmailNewOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneNewOtpSent, setPhoneNewOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailNewOtp, setEmailNewOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneNewOtp, setPhoneNewOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [verificationStepIndex, setVerificationStepIndex] = useState(0);
  const [emailCurrentVerificationMethod, setEmailCurrentVerificationMethod] =
    useState<"otp" | "password" | "google">("otp");
  const [currentPassword, setCurrentPassword] = useState("");
  const [identityBusy, setIdentityBusy] = useState(false);

  const requiresEmailVerification = needs.emailCurrent || needs.emailNew;
  const requiresEmailCurrentVerification = needs.emailCurrent;
  const requiresEmailNewVerification = needs.emailNew;
  const requiresPhoneVerification = needs.phoneCurrent || needs.phoneNew;
  const requiresPhoneCurrentVerification = needs.phoneCurrent;
  const requiresPhoneNewVerification = needs.phoneNew;

  const verificationSteps = useMemo(() => {
    const steps: Array<
      "emailCurrent" | "emailNew" | "phoneCurrent" | "phoneNew"
    > = [];
    if (requiresEmailVerification && requiresEmailCurrentVerification) {
      steps.push("emailCurrent");
    }
    if (requiresEmailVerification && requiresEmailNewVerification) {
      steps.push("emailNew");
    }
    if (requiresPhoneVerification && requiresPhoneCurrentVerification) {
      steps.push("phoneCurrent");
    }
    if (requiresPhoneVerification && requiresPhoneNewVerification) {
      steps.push("phoneNew");
    }
    return steps;
  }, [
    requiresEmailVerification,
    requiresEmailCurrentVerification,
    requiresEmailNewVerification,
    requiresPhoneVerification,
    requiresPhoneCurrentVerification,
    requiresPhoneNewVerification,
  ]);

  const currentVerificationStep =
    verificationSteps[verificationStepIndex] || null;
  const currentStepVerified =
    currentVerificationStep === "emailCurrent"
      ? emailVerifiedForChange
      : currentVerificationStep === "emailNew"
        ? emailNewVerifiedForChange
        : currentVerificationStep === "phoneCurrent"
          ? phoneVerifiedForChange
          : currentVerificationStep === "phoneNew"
            ? phoneNewVerifiedForChange
            : true;
  const isLastVerificationStep =
    verificationSteps.length === 0 ||
    verificationStepIndex >= verificationSteps.length - 1;

  const markPhoneVerifiedInStorage = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const updated = {
        ...parsed,
        phoneVerified: true,
        isPhoneVerified: true,
        whatsappVerified: true,
      };
      localStorage.setItem("user", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!open) return;
    setEmailVerifiedForChange(false);
    setEmailNewVerifiedForChange(false);
    setPhoneVerifiedForChange(false);
    setPhoneNewVerifiedForChange(false);
    setEmailOtpSent(false);
    setEmailNewOtpSent(false);
    setPhoneOtpSent(false);
    setPhoneNewOtpSent(false);
    setEmailOtp("");
    setEmailNewOtp("");
    setPhoneOtp("");
    setPhoneNewOtp("");
    setVerificationStepIndex(0);
    setEmailCurrentVerificationMethod("otp");
    setCurrentPassword("");
  }, [open, needs]);

  useEffect(() => {
    if (!open) return;
    setVerificationStepIndex(0);
    setEmailCurrentVerificationMethod("otp");
    setCurrentPassword("");
  }, [open]);

  const sendEmailChangeOtp = async () => {
    if (!contactSnapshot.email?.trim()) {
      toast({
        title: "Error",
        description: "No current email found on your account.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${apiBase}/contact-otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: "email",
          target: "current",
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to send email OTP",
        );
      setEmailOtpSent(true);
      toast({
        title: "OTP sent",
        description: "Verification code has been sent to your current email.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile email otp send",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyEmailChangeOtp = async () => {
    if (!contactSnapshot.email?.trim() || emailOtp.trim().length !== 6) {
      toast({
        title: "Error",
        description: "Enter the 6-digit email OTP first.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${apiBase}/contact-otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: "email",
          target: "current",
          otp: emailOtp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Email OTP verification failed",
        );
      setEmailVerifiedForChange(true);
      toast({
        title: "Email verified",
        description: "Current email verified. You can now save your new email.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile email otp verify",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyCurrentEmailWithPassword = async () => {
    if (!currentPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter your current password.",
        variant: "destructive",
      });
      return;
    }
    setIdentityBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${apiBase}/contact-identity/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          method: "password",
          password: currentPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "Password verification failed.",
        );
      }
      setEmailVerifiedForChange(true);
      toast({
        title: "Verified",
        description:
          "Current email verified with password. You can proceed to next step.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile current email password verify",
        ),
        variant: "destructive",
      });
    } finally {
      setIdentityBusy(false);
    }
  };

  const verifyCurrentEmailWithGoogleToken = async (idToken: string) => {
    setIdentityBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${apiBase}/contact-identity/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          method: "google",
          idToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "Google verification failed.",
        );
      }
      setEmailVerifiedForChange(true);
      toast({
        title: "Verified",
        description:
          "Current email verified with Google. You can proceed to next step.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile current email google verify",
        ),
        variant: "destructive",
      });
    } finally {
      setIdentityBusy(false);
    }
  };

  const sendNewEmailChangeOtp = async () => {
    if (!draftEmail?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new email first.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${apiBase}/contact-otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: "email",
          target: "new",
          email: draftEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to send OTP to new email",
        );
      setEmailNewOtpSent(true);
      toast({
        title: "OTP sent",
        description: "Verification code has been sent to your new email.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile new email otp send",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyNewEmailChangeOtp = async () => {
    if (!draftEmail?.trim() || emailNewOtp.trim().length !== 6) {
      toast({
        title: "Error",
        description: "Enter the 6-digit OTP sent to your new email.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${apiBase}/contact-otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: "email",
          target: "new",
          email: draftEmail.trim(),
          otp: emailNewOtp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "New email OTP verification failed",
        );
      setEmailNewVerifiedForChange(true);
      toast({
        title: "New email verified",
        description: "New email verified. You can now continue saving.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile new email otp verify",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const sendPhoneChangeOtp = async () => {
    if (!contactSnapshot.phone?.trim()) {
      toast({
        title: "Error",
        description: "No current phone number found on your account.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${apiBase}/contact-otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: "phone",
          target: "current",
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to send WhatsApp OTP",
        );
      setPhoneOtpSent(true);
      toast({
        title: "OTP sent",
        description: "Verification code has been sent to your current phone.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile phone otp send",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyPhoneChangeOtp = async () => {
    if (!contactSnapshot.phone?.trim() || phoneOtp.trim().length !== 6) {
      toast({
        title: "Error",
        description: "Enter the 6-digit phone OTP first.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${apiBase}/contact-otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: "phone",
          target: "current",
          otp: phoneOtp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Phone OTP verification failed",
        );
      setPhoneVerifiedForChange(true);
      markPhoneVerifiedInStorage();
      toast({
        title: "Phone verified",
        description: "Current phone verified. You can now save your new phone.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile phone otp verify",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const sendNewPhoneChangeOtp = async () => {
    if (!draftPhone?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new phone number first.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${apiBase}/contact-otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: "phone",
          target: "new",
          phone: draftPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to send OTP to new phone",
        );
      setPhoneNewOtpSent(true);
      toast({
        title: "OTP sent",
        description: "Verification code has been sent to your new phone.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile new phone otp send",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyNewPhoneChangeOtp = async () => {
    if (!draftPhone?.trim() || phoneNewOtp.trim().length !== 6) {
      toast({
        title: "Error",
        description: "Enter the 6-digit OTP sent to your new phone.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${apiBase}/contact-otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: "phone",
          target: "new",
          phone: draftPhone.trim(),
          otp: phoneNewOtp.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "New phone OTP verification failed",
        );
      setPhoneNewVerifiedForChange(true);
      markPhoneVerifiedInStorage();
      toast({
        title: "New phone verified",
        description: "New phone verified. You can now continue saving.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile new phone otp verify",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  useEffect(() => {
    if (
      !open ||
      currentVerificationStep !== "emailCurrent" ||
      emailCurrentVerificationMethod !== "google" ||
      emailVerifiedForChange
    ) {
      return;
    }

    const container = document.getElementById(
      "provider-google-contact-verify-button-container",
    );
    if (!container) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      container.innerHTML =
        '<p class="text-xs text-amber-700">Google verification is not configured.</p>';
      return;
    }

    const initGoogle = () => {
      const win = window as unknown as {
        google?: { accounts?: { id?: GoogleAccountsId } };
      };
      const g = win.google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response?.credential) {
            void verifyCurrentEmailWithGoogleToken(response.credential);
          }
        },
      });
      container.innerHTML = "";
      g.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "medium",
        text: "continue_with",
        width: 260,
      });
    };

    const win = window as unknown as {
      google?: { accounts?: { id?: GoogleAccountsId } };
    };

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
  }, [
    open,
    currentVerificationStep,
    emailCurrentVerificationMethod,
    emailVerifiedForChange,
  ]);

  const handleContinueSave = async () => {
    if (
      (requiresEmailCurrentVerification && !emailVerifiedForChange) ||
      (requiresEmailNewVerification && !emailNewVerifiedForChange) ||
      (requiresPhoneCurrentVerification && !phoneVerifiedForChange) ||
      (requiresPhoneNewVerification && !phoneNewVerifiedForChange)
    ) {
      return;
    }
    onOpenChange(false);
    await onContinueSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verify contact changes</DialogTitle>
          <DialogDescription>
            To protect your account, we first send OTP to your current contact
            before applying your new email or phone number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {verificationSteps.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  Step{" "}
                  {Math.min(
                    verificationStepIndex + 1,
                    verificationSteps.length,
                  )}{" "}
                  of {verificationSteps.length}
                </span>
                <span>
                  {currentVerificationStep === "emailCurrent"
                    ? "Verify current email"
                    : currentVerificationStep === "emailNew"
                      ? "Verify new email"
                      : currentVerificationStep === "phoneCurrent"
                        ? "Verify current phone"
                        : "Verify new phone"}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${((verificationStepIndex + 1) / verificationSteps.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {currentVerificationStep === "emailCurrent" && (
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Current email verification</Label>
                {emailVerifiedForChange ? (
                  <span className="text-xs text-green-700">Step completed</span>
                ) : (
                  <span className="text-xs text-amber-700">
                    Verification required
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 break-all">
                Current email: {contactSnapshot.email || "-"}
              </p>
              <p className="text-xs text-gray-500 break-all">
                New email: {draftEmail || "-"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={
                    emailCurrentVerificationMethod === "otp"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setEmailCurrentVerificationMethod("otp")}
                >
                  OTP
                </Button>
                <Button
                  type="button"
                  variant={
                    emailCurrentVerificationMethod === "password"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setEmailCurrentVerificationMethod("password")}
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5" />
                  Password
                </Button>
                <Button
                  type="button"
                  variant={
                    emailCurrentVerificationMethod === "google"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => setEmailCurrentVerificationMethod("google")}
                >
                  Google
                </Button>
              </div>

              {emailCurrentVerificationMethod === "otp" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sendEmailChangeOtp}
                    disabled={otpBusy}
                  >
                    {emailOtpSent ? "Resend OTP" : "Send OTP"}
                  </Button>
                  <Input
                    value={emailOtp}
                    onChange={(e) =>
                      setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="6-digit code"
                    className="sm:max-w-[180px]"
                  />
                  <Button
                    type="button"
                    onClick={verifyEmailChangeOtp}
                    disabled={otpBusy || emailOtp.trim().length !== 6}
                  >
                    Verify
                  </Button>
                </div>
              )}

              {emailCurrentVerificationMethod === "password" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="sm:max-w-[260px]"
                  />
                  <Button
                    type="button"
                    onClick={verifyCurrentEmailWithPassword}
                    disabled={identityBusy || !currentPassword.trim()}
                  >
                    {identityBusy ? "Verifying..." : "Verify password"}
                  </Button>
                </div>
              )}

              {emailCurrentVerificationMethod === "google" && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    If your account uses Google sign-in, verify with your Google
                    account.
                  </p>
                  <div
                    id="provider-google-contact-verify-button-container"
                    className="min-h-[40px]"
                  />
                </div>
              )}
            </div>
          )}

          {currentVerificationStep === "emailNew" && (
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>New email verification</Label>
                {emailNewVerifiedForChange ? (
                  <span className="text-xs text-green-700">Step completed</span>
                ) : (
                  <span className="text-xs text-amber-700">
                    Verification required
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 break-all">
                Current email: {contactSnapshot.email || "-"}
              </p>
              <p className="text-xs text-gray-500 break-all">
                New email: {draftEmail || "-"}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={sendNewEmailChangeOtp}
                  disabled={otpBusy}
                >
                  {emailNewOtpSent ? "Resend OTP" : "Send OTP"}
                </Button>
                <Input
                  value={emailNewOtp}
                  onChange={(e) =>
                    setEmailNewOtp(
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder="6-digit code"
                  className="sm:max-w-[180px]"
                />
                <Button
                  type="button"
                  onClick={verifyNewEmailChangeOtp}
                  disabled={otpBusy || emailNewOtp.trim().length !== 6}
                >
                  Verify
                </Button>
              </div>
            </div>
          )}

          {currentVerificationStep === "phoneCurrent" && (
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Phone verification</Label>
                {phoneVerifiedForChange ? (
                  <span className="text-xs text-green-700">Step completed</span>
                ) : (
                  <span className="text-xs text-amber-700">
                    Verification required
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 break-all">
                Current phone: {contactSnapshot.phone || "-"}
              </p>
              <p className="text-xs text-gray-500 break-all">
                New phone: {draftPhone || "-"}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={sendPhoneChangeOtp}
                  disabled={otpBusy}
                >
                  {phoneOtpSent ? "Resend OTP" : "Send OTP"}
                </Button>
                <Input
                  value={phoneOtp}
                  onChange={(e) =>
                    setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="6-digit code"
                  className="sm:max-w-[180px]"
                />
                <Button
                  type="button"
                  onClick={verifyPhoneChangeOtp}
                  disabled={otpBusy || phoneOtp.trim().length !== 6}
                >
                  Verify
                </Button>
              </div>
            </div>
          )}

          {currentVerificationStep === "phoneNew" && (
            <div className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label>New phone verification</Label>
                {phoneNewVerifiedForChange ? (
                  <span className="text-xs text-green-700">Step completed</span>
                ) : (
                  <span className="text-xs text-amber-700">
                    Verification required
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 break-all">
                Current phone: {contactSnapshot.phone || "-"}
              </p>
              <p className="text-xs text-gray-500 break-all">
                New phone: {draftPhone || "-"}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={sendNewPhoneChangeOtp}
                  disabled={otpBusy}
                >
                  {phoneNewOtpSent ? "Resend OTP" : "Send OTP"}
                </Button>
                <Input
                  value={phoneNewOtp}
                  onChange={(e) =>
                    setPhoneNewOtp(
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    )
                  }
                  placeholder="6-digit code"
                  className="sm:max-w-[180px]"
                />
                <Button
                  type="button"
                  onClick={verifyNewPhoneChangeOtp}
                  disabled={otpBusy || phoneNewOtp.trim().length !== 6}
                >
                  Verify
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {verificationStepIndex > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setVerificationStepIndex((prev) => Math.max(0, prev - 1))
              }
            >
              Previous
            </Button>
          )}
          {!isLastVerificationStep && (
            <Button
              type="button"
              onClick={() =>
                setVerificationStepIndex((prev) =>
                  Math.min(prev + 1, verificationSteps.length - 1),
                )
              }
              disabled={!currentStepVerified}
            >
              Next step
            </Button>
          )}
          <Button
            type="button"
            onClick={() => void handleContinueSave()}
            disabled={
              !isLastVerificationStep ||
              (requiresEmailCurrentVerification && !emailVerifiedForChange) ||
              (requiresEmailNewVerification && !emailNewVerifiedForChange) ||
              (requiresPhoneCurrentVerification && !phoneVerifiedForChange) ||
              (requiresPhoneNewVerification && !phoneNewVerifiedForChange)
            }
          >
            Continue save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
