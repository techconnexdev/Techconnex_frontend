"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, Shield, CreditCard, Trash2, Mail, Globe } from "lucide-react";
import Loading from "../projects/loading";
import { ProviderSettingsTour } from "@/components/provider/ProviderSettingsTour";
import { clearOnboardingCache } from "@/components/provider/ProviderOnboardingPromptDialog";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/contexts/I18nProvider";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALES_LANGUAGE_PICKER,
  type Locale,
} from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  mergeUserLocaleInStorage,
  mergeUserPreferredCurrencyInStorage,
} from "@/lib/userLocale";

type PasswordRuleId = "min8" | "upper" | "lower" | "digit" | "special";

const PASSWORD_RULE_KEYS: Record<PasswordRuleId, MessageKey> = {
  min8: "provider.settings.password.missing.min8",
  upper: "provider.settings.password.missing.upper",
  lower: "provider.settings.password.missing.lower",
  digit: "provider.settings.password.missing.digit",
  special: "provider.settings.password.missing.special",
};

type NotificationSettings = {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  projectUpdates: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
};

type PrivacySettings = {
  profileVisibility?: string;
  showEmail: boolean;
  showPhone: boolean;
  allowMessages: boolean;
};

type Payment = {
  id: string;
  method: string;
  last4?: string;
  amount: number;
  currency?: string;
  status: string;
  createdAt: string;
};

export default function ProviderSettingsPage() {
  const { t, setLocale } = useI18n();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("notifications");
  const [systemLocale, setSystemLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [preferredCurrency, setPreferredCurrency] = useState("MYR");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] =
    useState<NotificationSettings | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: PasswordRuleId[];
  }>({ score: 0, feedback: [] });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteDialogError, setDeleteDialogError] = useState("");
  const currencyOptions = ["MYR", "USD", "EUR", "GBP", "SGD", "AUD", "JPY", "AED", "IDR"];

  useEffect(() => {
    const tab = searchParams.get("tab");
    const allowed = new Set(["notifications", "language", "privacy", "security"]);
    if (tab && allowed.has(tab)) setActiveTab(tab);
  }, [searchParams]);

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteDialogError(t("provider.settings.delete.passwordRequired"));
      return;
    }

    try {
      setDeleting(true);
      setDeleteMessage("");
      setDeleteDialogError("");

      // Require password confirmation before deleting account
      const response = await fetch(`${API_URL}/settings/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setDeleteMessage(t("provider.settings.delete.success"));
        setDeleteDialogOpen(false);
        setDeletePassword("");

        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          clearOnboardingCache();
          sessionStorage.clear();
          window.location.href = "/auth/login"; // Redirect to login page
        }, 2000);
      } else {
        const apiMsg =
          (typeof data?.error === "string" && data.error) ||
          (typeof data?.message === "string" && data.message) ||
          "";
        setDeleteDialogError(
          apiMsg ||
            getUserFriendlyErrorMessage(
              undefined,
              "provider settings delete account",
            ),
        );
      }
    } catch (error) {
      setDeleteDialogError(
        getUserFriendlyErrorMessage(error, "provider settings delete account"),
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveNotifications = async (
    overrides?: Partial<NotificationSettings>,
  ) => {
    try {
      setSaving(true);
      setMessage("");
      const payload = {
        ...notifications,
        ...overrides,
        // Keep WhatsApp notifications OFF until phone is verified.
        smsNotifications: hasVerifiedPhone
          ? Boolean({ ...notifications, ...overrides }.smsNotifications)
          : false,
      };
      const response = await fetch(
        `${API_URL}/settings/${userId}/notifications`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(t("provider.settings.notifications.saveSuccess"));
      } else {
        const apiMsg = typeof data?.message === "string" ? data.message : "";
        setMessage(apiMsg || t("provider.settings.notifications.saveError"));
      }
    } catch (error) {
      setMessage(
        getUserFriendlyErrorMessage(error, "provider settings notifications") ||
          t("provider.settings.notifications.saveError"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setSaving(true);
      setMessage("");
      const response = await fetch(`${API_URL}/settings/${userId}/privacy`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(privacy),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(t("provider.settings.privacy.saveSuccess"));
      } else {
        const apiMsg = typeof data?.message === "string" ? data.message : "";
        setMessage(apiMsg || t("provider.settings.privacy.saveError"));
      }
    } catch (error) {
      setMessage(
        getUserFriendlyErrorMessage(error, "provider settings privacy") ||
          t("provider.settings.privacy.saveError"),
      );
    } finally {
      setSaving(false);
    }
  };

  const validatePasswordStrength = (password: string) => {
    const feedback: PasswordRuleId[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("min8");
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("upper");
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("lower");
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("digit");
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push("special");
    }

    return { score, feedback };
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage(t("provider.settings.password.fillAll"));
      setPasswordSuccess(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage(t("provider.settings.password.mismatch"));
      setPasswordSuccess(false);
      return;
    }

    const strength = validatePasswordStrength(newPassword);
    setPasswordStrength(strength);

    if (strength.score < 5) {
      setPasswordMessage(
        t("provider.settings.password.mustStronger", {
          list: strength.feedback
            .map((id) => t(PASSWORD_RULE_KEYS[id]))
            .join(", "),
        }),
      );
      setPasswordSuccess(false);
      return;
    }

    try {
      setLoadingPassword(true);
      setPasswordMessage("");

      const response = await fetch(
        `${API_URL}/auth/provider/profile/password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword,
            newPassword,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess(true);
        setPasswordMessage(t("provider.settings.password.success"));
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordSuccess(false);
        setPasswordMessage(
          typeof data?.message === "string" && data.message
            ? data.message
            : t("provider.settings.password.failed"),
        );
      }
    } catch (error) {
      setPasswordSuccess(false);
      setPasswordMessage(
        getUserFriendlyErrorMessage(error, "provider settings password"),
      );
    } finally {
      setLoadingPassword(false);
    }
  };
  // Get user data and token
  const getAuthData = () => {
    if (typeof window === "undefined") return { token: "", user: null };

    try {
      const token = localStorage.getItem("token");
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      return { token, user };
    } catch {
      return { token: "", user: null };
    }
  };

  const { token, user } = getAuthData();
  const userId =
    (user &&
    typeof user === "object" &&
    "id" in user &&
    typeof user.id === "string"
      ? user.id
      : null) ||
    (user &&
    typeof user === "object" &&
    "userId" in user &&
    typeof (user as { userId?: string }).userId === "string"
      ? (user as { userId: string }).userId
      : null);
  const hasVerifiedPhone = Boolean(
    user &&
      typeof user === "object" &&
      (user.phoneVerified ?? user.isPhoneVerified ?? user.whatsappVerified),
  );

  // 🔹 Fetch settings and payment info
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, paymentsRes] = await Promise.all([
          fetch(`${API_URL}/settings/${userId}`, {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }),
          fetch(`${API_URL}/settings/${userId}/payments`, {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }),
        ]);

        const settingsData = await settingsRes.json().catch(() => ({}));
        const paymentsData = await paymentsRes.json().catch(() => []);

        if (!settingsRes.ok) {
          console.error("Settings fetch failed:", settingsRes.status, settingsData);
          setLoading(false);
          return;
        }

        setNotifications({
          emailNotifications: settingsData.emailNotifications ?? false,
          smsNotifications: hasVerifiedPhone
            ? (settingsData.smsNotifications ?? false)
            : false,
          pushNotifications: settingsData.pushNotifications ?? true,
          projectUpdates: settingsData.projectUpdates ?? false,
          marketingEmails: settingsData.marketingEmails ?? false,
          weeklyReports: settingsData.weeklyReports ?? false,
        });

        setPrivacy({
          profileVisibility: settingsData.profileVisibility,
          showEmail: settingsData.showEmail,
          showPhone: settingsData.showPhone,
          allowMessages: settingsData.allowMessages,
        });

        const rawLocale = settingsData.locale;
        if (typeof rawLocale === "string" && isLocale(rawLocale)) {
          const next = rawLocale === "ar" ? DEFAULT_LOCALE : rawLocale;
          setSystemLocale(next);
          if (rawLocale === "ar") {
            setLocale(DEFAULT_LOCALE);
            mergeUserLocaleInStorage(DEFAULT_LOCALE);
          }
        }
        const rawCurrency = settingsData.preferredCurrency;
        if (typeof rawCurrency === "string" && rawCurrency.trim()) {
          const next = rawCurrency.trim().toUpperCase();
          setPreferredCurrency(next);
          mergeUserPreferredCurrencyInStorage(next);
        }

        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId && API_URL) {
      fetchData();
    }
  }, [userId, API_URL, token, hasVerifiedPhone]);

  const handleSaveLocale = async () => {
    if (!userId || !token) return;
    try {
      setSaving(true);
      setMessage("");
      const response = await fetch(`${API_URL}/settings/${userId}/locale`, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        body: JSON.stringify({
          locale: systemLocale,
          preferredCurrency,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setLocale(systemLocale);
        mergeUserLocaleInStorage(systemLocale);
        if (
          typeof data?.preferredCurrency === "string" &&
          data.preferredCurrency.trim()
        ) {
          const savedCur = data.preferredCurrency.trim().toUpperCase();
          setPreferredCurrency(savedCur);
          mergeUserPreferredCurrencyInStorage(savedCur);
        }
        setMessage(t("settings.language.saved"));
      } else {
        setMessage(
          getUserFriendlyErrorMessage(
            data?.message != null ? new Error(String(data.message)) : undefined,
            "provider settings locale",
          ),
        );
      }
    } catch (error) {
      setMessage(
        getUserFriendlyErrorMessage(error, "provider settings locale"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return Loading();

  return (
    <>
      <ProviderSettingsTour />
      <div className="space-y-8">
        {/* Header */}
        <div data-tour-step="0">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("provider.settings.title")}
          </h1>
          <p className="text-gray-600">{t("provider.settings.subtitle")}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger value="notifications" data-tour-step="1">
              {t("provider.settings.tabs.notifications")}
            </TabsTrigger>
            <TabsTrigger value="language">
              {t("settings.language.title")}
            </TabsTrigger>
            <TabsTrigger value="privacy">
              {t("provider.settings.tabs.privacy")}
            </TabsTrigger>
            {/* <TabsTrigger value="billing">Billing</TabsTrigger> */}
            <TabsTrigger value="security" data-tour-step="2">
              {t("provider.settings.tabs.security")}
            </TabsTrigger>
          </TabsList>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t("provider.settings.notifications.cardTitle")}
                </CardTitle>
                <CardDescription>
                  {t("provider.settings.notifications.cardDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                    <Bell className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div>
                      <Label className="font-medium">
                        {t("provider.settings.notifications.inAppLabel")}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t("provider.settings.notifications.inAppDesc")}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor="email-notifications">
                          {t("provider.settings.notifications.emailLabel")}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {t("provider.settings.notifications.emailDesc")}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notifications?.emailNotifications ?? false}
                      onCheckedChange={(checked) =>
                        setNotifications(
                          (prev) =>
                            ({
                              ...prev!,
                              emailNotifications: checked,
                            }) as NotificationSettings,
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="whatsapp-notifications">
                        {t("provider.settings.notifications.whatsappLabel")}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t("provider.settings.notifications.whatsappDesc")}
                      </p>
                      {!hasVerifiedPhone && (
                        <p className="text-xs text-amber-700 mt-1">
                          Verify your phone number first to enable WhatsApp
                          notifications.
                        </p>
                      )}
                    </div>
                    <Switch
                      id="whatsapp-notifications"
                      checked={notifications?.smsNotifications ?? false}
                      disabled={!hasVerifiedPhone}
                      onCheckedChange={(checked) =>
                        setNotifications(
                          (prev) =>
                            ({
                              ...prev!,
                              smsNotifications: checked,
                            }) as NotificationSettings,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => handleSaveNotifications()}
                    disabled={saving}
                  >
                    {saving
                      ? t("provider.settings.saving")
                      : t("provider.settings.notifications.save")}
                  </Button>
                </div>
                {message && (
                  <p className="text-sm text-gray-600 mt-2">{message}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="language">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {t("settings.language.title")}
                </CardTitle>
                <CardDescription>
                  {t("settings.language.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="system-locale-provider">
                    {t("settings.language.label")}
                  </Label>
                  <Select
                    value={systemLocale}
                    onValueChange={(v) => {
                      if (isLocale(v)) setSystemLocale(v);
                    }}
                  >
                    <SelectTrigger id="system-locale-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Arabic temporarily hidden — see LOCALES_LANGUAGE_PICKER in locales.ts */}
                      {LOCALES_LANGUAGE_PICKER.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {t(`settings.language.option.${loc}` as MessageKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="preferred-currency-provider">
                    Preferred currency
                  </Label>
                  <Select
                    value={preferredCurrency}
                    onValueChange={(v) => setPreferredCurrency(v)}
                  >
                    <SelectTrigger id="preferred-currency-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => void handleSaveLocale()} disabled={saving}>
                    {saving
                      ? t("provider.settings.saving")
                      : t("settings.language.save")}
                  </Button>
                </div>
                {message && <p className="text-sm text-gray-600">{message}</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy */}
          <TabsContent value="privacy">
            <Card data-tour-step="priv-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  {t("provider.settings.privacy.cardTitle")}
                </CardTitle>
                <CardDescription>
                  {t("provider.settings.privacy.cardDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* <div className="space-y-2">
                    <Label htmlFor="profile-visibility">
                      Profile Visibility
                    </Label>
                    <Select
                      value={privacy.profileVisibility}
                      onValueChange={(value) =>
                        setPrivacy({ ...privacy, profileVisibility: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          Public - Visible to all users
                        </SelectItem>
                        <SelectItem value="verified">
                          Verified Users Only
                        </SelectItem>
                        <SelectItem value="private">
                          Private - Hidden from search
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div> */}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-email">
                        {t("provider.settings.privacy.showEmailLabel")}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t("provider.settings.privacy.showEmailDesc")}
                      </p>
                    </div>
                    <Switch
                      id="show-email"
                      checked={privacy?.showEmail ?? false}
                      onCheckedChange={(checked) =>
                        setPrivacy({
                          ...privacy,
                          showEmail: checked,
                        } as PrivacySettings)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-phone">
                        {t("provider.settings.privacy.showPhoneLabel")}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t("provider.settings.privacy.showPhoneDesc")}
                      </p>
                    </div>
                    <Switch
                      id="show-phone"
                      checked={privacy?.showPhone ?? false}
                      onCheckedChange={(checked) =>
                        setPrivacy({
                          ...privacy,
                          showPhone: checked,
                        } as PrivacySettings)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-messages">
                        {t("provider.settings.privacy.allowMessagesLabel")}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t("provider.settings.privacy.allowMessagesDesc")}
                      </p>
                    </div>
                    <Switch
                      id="allow-messages"
                      checked={privacy?.allowMessages ?? false}
                      onCheckedChange={(checked) =>
                        setPrivacy({
                          ...privacy,
                          allowMessages: checked,
                        } as PrivacySettings)
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePrivacy} disabled={saving}>
                    {saving
                      ? t("provider.settings.saving")
                      : t("provider.settings.privacy.save")}
                  </Button>
                </div>
                {message && (
                  <p className="text-sm text-gray-600 mt-2">{message}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    {t("provider.settings.billing.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("provider.settings.billing.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {payments.length > 0 ? (
                    payments.map((p) => (
                      <div key={p.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {p.method === "CREDIT_CARD"
                                ? "•••• •••• •••• " + p.last4
                                : p.method}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {(p.currency || "MYR")} {p.amount.toFixed(2)}
                            </p>
                            <p
                              className={`text-sm ${
                                p.status === "PAID"
                                  ? "text-green-600"
                                  : "text-red-500"
                              }`}
                            >
                              {p.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      {t("provider.settings.billing.noPayments")}
                    </p>
                  )}

                  <Button variant="outline" className="w-full bg-transparent">
                    {t("provider.settings.billing.addMethod")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <div className="grid gap-6">
              <Card data-tour-step="sec-card">
                <CardHeader>
                  <CardTitle>
                    {t("provider.settings.password.cardTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("provider.settings.password.cardDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Password fields */}
                  <div className="space-y-2">
                    <Label htmlFor="current-password">
                      {t("provider.settings.password.current")}
                    </Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">
                      {t("provider.settings.password.new")}
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (e.target.value) {
                          setPasswordStrength(
                            validatePasswordStrength(e.target.value),
                          );
                        } else {
                          setPasswordStrength({ score: 0, feedback: [] });
                        }
                      }}
                    />
                    {newPassword && (
                      <div className="mt-2">
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${
                              passwordStrength.score === 5
                                ? "bg-green-500"
                                : passwordStrength.score >= 3
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${(passwordStrength.score / 5) * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {t("provider.settings.password.strength", {
                            score: passwordStrength.score,
                            level:
                              passwordStrength.score === 5
                                ? t("provider.settings.password.strengthStrong")
                                : passwordStrength.score >= 3
                                  ? t(
                                      "provider.settings.password.strengthMedium",
                                    )
                                  : t(
                                      "provider.settings.password.strengthWeak",
                                    ),
                          })}
                        </p>
                        {passwordStrength.feedback.length > 0 && (
                          <ul className="text-xs text-red-500 mt-1 list-disc pl-4">
                            {passwordStrength.feedback.map((id) => (
                              <li key={id}>{t(PASSWORD_RULE_KEYS[id])}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      {t("provider.settings.password.confirm")}
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={loadingPassword}
                  >
                    {loadingPassword
                      ? t("provider.settings.password.updating")
                      : t("provider.settings.password.update")}
                  </Button>

                  {passwordMessage && (
                    <p
                      className={`text-sm ${
                        passwordSuccess ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {passwordMessage}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                {/* <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Authentication</p>
                      <p className="text-sm text-gray-500">
                        Receive codes via SMS to +60123456789
                      </p>
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={(checked) => handleToggle2FA(checked)}
                    />
                    {twoFactorMessage && (
                      <p className="text-sm text-gray-600 mt-2">
                        {twoFactorMessage}
                      </p>
                    )}
                  </div>
                </CardContent> */}
              </Card>

              <Card className="border-red-200" data-tour-step="del-card">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    {t("provider.settings.delete.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("provider.settings.delete.cardDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {t("provider.settings.delete.warningBody")}
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDeleteDialogOpen(true);
                      setDeleteMessage("");
                      setDeleteDialogError("");
                    }}
                    disabled={deleting}
                    className="mt-4 text-white"
                  >
                    {deleting
                      ? t("provider.settings.delete.deleting")
                      : t("provider.settings.delete.button")}
                  </Button>

                  {deleteMessage && (
                    <p className="text-sm text-gray-600 mt-2">
                      {deleteMessage}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Dialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                  setDeleteDialogOpen(open);
                  if (!open) {
                    setDeletePassword("");
                    setDeleteDialogError("");
                  }
                }}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-600">
                      {t("provider.settings.delete.dialogTitle")}
                    </DialogTitle>
                    <DialogDescription>
                      {t("provider.settings.delete.dialogDesc")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="delete-account-password">
                      {t("provider.settings.delete.passwordLabel")}
                    </Label>
                    <Input
                      id="delete-account-password"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => {
                        setDeletePassword(e.target.value);
                        if (deleteDialogError) setDeleteDialogError("");
                      }}
                      placeholder={t(
                        "provider.settings.delete.passwordPlaceholder",
                      )}
                      aria-invalid={!!deleteDialogError}
                      className={
                        deleteDialogError
                          ? "border-red-500 focus-visible:ring-red-500"
                          : undefined
                      }
                    />
                    {deleteDialogError ? (
                      <p className="text-sm text-red-600" role="alert">
                        {deleteDialogError}
                      </p>
                    ) : null}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        setDeletePassword("");
                        setDeleteDialogError("");
                      }}
                      disabled={deleting}
                    >
                      {t("provider.settings.delete.cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      className="text-white"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                    >
                      {deleting
                        ? t("provider.settings.delete.deleting")
                        : t("provider.settings.delete.confirm")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
