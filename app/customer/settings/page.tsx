"use client";

import { useEffect, useState } from "react";
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
import { CustomerSettingsTour } from "@/components/customer/CustomerSettingsTour";
import { Loader2 } from "lucide-react";
import { CustomerSettingsPageSkeleton } from "@/components/customer/CustomerPageSkeletons";
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

type NotificationSettings = {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  projectUpdates: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
};

type PrivacySettings = {
  profileVisibility: string;
  showEmail: boolean;
  showPhone: boolean;
  allowMessages: boolean;
};

type Payment = {
  id: string;
  method: string;
  last4?: string;
  createdAt: string;
  amount: number;
  status: string;
};

const PASSWORD_RULE_CHECKS: {
  test: (password: string) => boolean;
  key: MessageKey;
}[] = [
  {
    test: (p) => p.length >= 8,
    key: "customer.settings.password.req.minLength",
  },
  {
    test: (p) => /[A-Z]/.test(p),
    key: "customer.settings.password.req.uppercase",
  },
  {
    test: (p) => /[a-z]/.test(p),
    key: "customer.settings.password.req.lowercase",
  },
  {
    test: (p) => /[0-9]/.test(p),
    key: "customer.settings.password.req.number",
  },
  {
    test: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
    key: "customer.settings.password.req.special",
  },
];

function evaluatePasswordStrength(password: string): {
  score: number;
  missing: MessageKey[];
} {
  let score = 0;
  const missing: MessageKey[] = [];
  for (const { test, key } of PASSWORD_RULE_CHECKS) {
    if (test(password)) score += 1;
    else missing.push(key);
  }
  return { score, missing };
}

export default function CustomerSettingsPage() {
  const { t, setLocale, locale } = useI18n();
  const [activeTab, setActiveTab] = useState("notifications");
  const dateLocale =
    locale === "ar" ? "ar" : locale === "id" ? "id-ID" : "en-US";
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
    missing: MessageKey[];
  }>({ score: 0, missing: [] });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteDialogError, setDeleteDialogError] = useState("");
  const currencyOptions = [
    "MYR",
    "USD",
    "EUR",
    "GBP",
    "SGD",
    "AUD",
    "JPY",
    "AED",
    "IDR",
  ];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    const allowed = new Set([
      "notifications",
      "language",
      "privacy",
      "security",
    ]);
    if (tab && allowed.has(tab)) setActiveTab(tab);
  }, []);

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteDialogError(t("customer.settings.delete.passwordRequired"));
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

      if (response.ok) {
        setDeleteMessage(t("customer.settings.delete.success"));
        setDeleteDialogOpen(false);
        setDeletePassword("");

        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          sessionStorage.clear();
          window.location.href = "/auth/login"; // Redirect to login page
        }, 2000);
      } else {
        const data = await response.json().catch(() => ({}));
        const apiMsg =
          (typeof data?.error === "string" && data.error) ||
          (typeof data?.message === "string" && data.message) ||
          "";
        setDeleteDialogError(
          apiMsg ||
            getUserFriendlyErrorMessage(undefined, "customer settings delete"),
        );
      }
    } catch (error) {
      setDeleteDialogError(
        getUserFriendlyErrorMessage(error, "customer settings delete"),
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
        setMessage(t("customer.settings.toast.notificationsSaved"));
      } else {
        setMessage(
          getUserFriendlyErrorMessage(
            data?.message != null ? new Error(data.message) : undefined,
            "customer settings notifications",
          ),
        );
      }
    } catch (error) {
      setMessage(
        getUserFriendlyErrorMessage(error, "customer settings notifications"),
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
        setMessage(t("customer.settings.toast.privacySaved"));
      } else {
        setMessage(
          getUserFriendlyErrorMessage(
            data?.message != null ? new Error(data.message) : undefined,
            "customer settings privacy",
          ),
        );
      }
    } catch (error) {
      setMessage(
        getUserFriendlyErrorMessage(error, "customer settings privacy"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage(t("customer.settings.password.fillAll"));
      setPasswordSuccess(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage(t("customer.settings.password.mismatch"));
      setPasswordSuccess(false);
      return;
    }

    const strength = evaluatePasswordStrength(newPassword);
    setPasswordStrength(strength);

    if (strength.score < 5) {
      setPasswordMessage(
        t("customer.settings.password.weakBody", {
          list: strength.missing.map((k) => t(k)).join(", "),
        }),
      );
      setPasswordSuccess(false);
      return;
    }

    try {
      setLoadingPassword(true);
      setPasswordMessage("");

      const response = await fetch(`${API_URL}/auth/company/profile/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess(true);
        setPasswordMessage(t("customer.settings.password.success"));
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordSuccess(false);
        setPasswordMessage(
          getUserFriendlyErrorMessage(
            data?.message != null ? new Error(data.message) : undefined,
            "customer settings password",
          ),
        );
      }
    } catch (error) {
      setPasswordSuccess(false);
      setPasswordMessage(
        getUserFriendlyErrorMessage(error, "customer settings password"),
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
  const userId = user?.id;
  const hasVerifiedPhone = Boolean(
    user?.phoneVerified ?? user?.isPhoneVerified ?? user?.whatsappVerified,
  );

  // 🔹 Fetch settings and payment info
  useEffect(() => {
    if (!userId || !API_URL) {
      // If no userId or API_URL, still set loading to false so content can render
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [settingsRes, paymentsRes] = await Promise.all([
          fetch(`${API_URL}/settings/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/settings/${userId}/payments`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const settingsData = await settingsRes.json();
        const paymentsData = await paymentsRes.json();

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
          profileVisibility: settingsData.profileVisibility ?? "public",
          showEmail: settingsData.showEmail ?? false,
          showPhone: settingsData.showPhone ?? false,
          allowMessages: settingsData.allowMessages ?? false,
        });

        const rawLocale = settingsData.locale;
        if (typeof rawLocale === "string" && isLocale(rawLocale)) {
          // Arabic temporarily not in language picker; fall back for display/save.
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
        getUserFriendlyErrorMessage(error, "customer settings fetch");
        setNotifications({
          emailNotifications: false,
          smsNotifications: false,
          pushNotifications: true,
          projectUpdates: false,
          marketingEmails: false,
          weeklyReports: false,
        });
        setPrivacy({
          profileVisibility: "public",
          showEmail: false,
          showPhone: false,
          allowMessages: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, API_URL, token, hasVerifiedPhone]);

  const handleSaveLocale = async () => {
    if (!userId || !token) return;
    try {
      setSaving(true);
      setMessage("");
      const response = await fetch(`${API_URL}/settings/${userId}/locale`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ locale: systemLocale, preferredCurrency }),
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
            "customer settings locale",
          ),
        );
      }
    } catch (error) {
      setMessage(
        getUserFriendlyErrorMessage(error, "customer settings locale"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <CustomerSettingsTour />
        <CustomerSettingsPageSkeleton
          loadingLabel={t("customer.settings.page.loading")}
        />
      </>
    );
  }

  return (
    <>
      <CustomerSettingsTour />
      <div className="space-y-8">
        {/* Header */}
        <div data-tour-step="0">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("customer.settings.page.title")}
          </h1>
          <p className="text-gray-600">
            {t("customer.settings.page.subtitle")}
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger value="notifications" data-tour-step="1">
              {t("customer.settings.tab.notifications")}
            </TabsTrigger>
            <TabsTrigger value="language">
              {t("settings.language.title")}
            </TabsTrigger>
            <TabsTrigger value="privacy">
              {t("customer.settings.tab.privacy")}
            </TabsTrigger>
            {/* <TabsTrigger value="billing">Billing</TabsTrigger> */}
            <TabsTrigger value="security" data-tour-step="2">
              {t("customer.settings.tab.security")}
            </TabsTrigger>
          </TabsList>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  {t("customer.settings.notifications.title")}
                </CardTitle>
                <CardDescription>
                  {t("customer.settings.notifications.desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                    <Bell className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div>
                      <Label className="font-medium">
                        {t("customer.settings.notifications.inApp.title")}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t("customer.settings.notifications.inApp.desc")}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <Label htmlFor="email-notifications">
                          {t("customer.settings.notifications.email.label")}
                        </Label>
                        <p className="text-sm text-gray-500">
                          {t("customer.settings.notifications.email.desc")}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notifications?.emailNotifications ?? false}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev!,
                          emailNotifications: checked,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="whatsapp-notifications">
                        {t("customer.settings.notifications.whatsapp.label")}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t("customer.settings.notifications.whatsapp.desc")}
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
                        setNotifications((prev) => ({
                          ...prev!,
                          smsNotifications: checked,
                        }))
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
                      ? t("customer.settings.common.saving")
                      : t("customer.settings.notifications.savePrefs")}
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
                  <Label htmlFor="system-locale">
                    {t("settings.language.label")}
                  </Label>
                  <Select
                    value={systemLocale}
                    onValueChange={(v) => {
                      if (isLocale(v)) setSystemLocale(v);
                    }}
                  >
                    <SelectTrigger id="system-locale">
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
                  <Label htmlFor="preferred-currency-customer">
                    Preferred currency
                  </Label>
                  <Select
                    value={preferredCurrency}
                    onValueChange={(v) => setPreferredCurrency(v)}
                  >
                    <SelectTrigger id="preferred-currency-customer">
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
                  <Button
                    onClick={() => void handleSaveLocale()}
                    disabled={saving}
                  >
                    {saving
                      ? t("customer.settings.common.saving")
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
                  {t("customer.settings.privacy.title")}
                </CardTitle>
                <CardDescription>
                  {t("customer.settings.privacy.desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-email">
                        {t("customer.settings.privacy.showEmail.label")}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t("customer.settings.privacy.showEmail.desc")}
                      </p>
                    </div>
                    <Switch
                      id="show-email"
                      checked={privacy?.showEmail ?? false}
                      onCheckedChange={(checked) =>
                        setPrivacy((prev) => ({
                          profileVisibility:
                            prev?.profileVisibility ?? "public",
                          showEmail: checked,
                          showPhone: prev?.showPhone ?? false,
                          allowMessages: prev?.allowMessages ?? false,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-phone">
                        {t("customer.settings.privacy.showPhone.label")}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t("customer.settings.privacy.showPhone.desc")}
                      </p>
                    </div>
                    <Switch
                      id="show-phone"
                      checked={privacy?.showPhone ?? false}
                      onCheckedChange={(checked) =>
                        setPrivacy((prev) => ({
                          profileVisibility:
                            prev?.profileVisibility ?? "public",
                          showEmail: prev?.showEmail ?? false,
                          showPhone: checked,
                          allowMessages: prev?.allowMessages ?? false,
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-messages">
                        {t("customer.settings.privacy.allowMessages.label")}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {t("customer.settings.privacy.allowMessages.desc")}
                      </p>
                    </div>
                    <Switch
                      id="allow-messages"
                      checked={privacy?.allowMessages ?? false}
                      onCheckedChange={(checked) =>
                        setPrivacy((prev) => ({
                          profileVisibility:
                            prev?.profileVisibility ?? "public",
                          showEmail: prev?.showEmail ?? false,
                          showPhone: prev?.showPhone ?? false,
                          allowMessages: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePrivacy} disabled={saving}>
                    {saving
                      ? t("customer.settings.common.saving")
                      : t("customer.settings.privacy.save")}
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
                    {t("customer.settings.billing.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("customer.settings.billing.desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {payments.length > 0 ? (
                    payments.map((p) => (
                      <div key={p.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {p.method === "CREDIT_CARD" && p.last4
                                ? t(
                                    "customer.settings.billing.creditCardMasked",
                                    {
                                      last4: p.last4,
                                    },
                                  )
                                : p.method}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(p.createdAt).toLocaleDateString(
                                dateLocale,
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {t("customer.settings.billing.currency", {
                                amount: p.amount.toFixed(2),
                              })}
                            </p>
                            <p
                              className={`text-sm ${
                                p.status === "PAID"
                                  ? "text-green-600"
                                  : "text-red-500"
                              }`}
                            >
                              {p.status === "PAID"
                                ? t("customer.settings.billing.statusPaid")
                                : p.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      {t("customer.settings.billing.empty")}
                    </p>
                  )}

                  <Button variant="outline" className="w-full bg-transparent">
                    {t("customer.settings.billing.addMethod")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("customer.settings.password.title")}</CardTitle>
                  <CardDescription>
                    {t("customer.settings.password.desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Password fields */}
                  <div className="space-y-2">
                    <Label htmlFor="current-password">
                      {t("customer.settings.password.current")}
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
                      {t("customer.settings.password.new")}
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (e.target.value) {
                          setPasswordStrength(
                            evaluatePasswordStrength(e.target.value),
                          );
                        } else {
                          setPasswordStrength({ score: 0, missing: [] });
                        }
                      }}
                    />
                    {newPassword && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1.5 flex-1 rounded ${
                                level <= passwordStrength.score
                                  ? passwordStrength.score <= 2
                                    ? "bg-red-500"
                                    : passwordStrength.score <= 3
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          {passwordStrength.score === 5 ? (
                            <span className="text-green-600 font-medium">
                              {t("customer.settings.password.strength.strong")}
                            </span>
                          ) : passwordStrength.score > 0 ? (
                            <span className="text-yellow-600">
                              {t("customer.settings.password.strength.score", {
                                n: passwordStrength.score,
                              })}
                            </span>
                          ) : (
                            t("customer.settings.password.strength.mustInclude")
                          )}
                        </p>
                        {passwordStrength.missing.length > 0 && (
                          <ul className="text-xs text-gray-500 list-disc list-inside space-y-0.5">
                            {passwordStrength.missing.map((reqKey) => (
                              <li key={reqKey}>{t(reqKey)}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      {t("customer.settings.password.confirm")}
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
                      ? t("customer.settings.common.updating")
                      : t("customer.settings.password.update")}
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

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    {t("customer.settings.delete.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("customer.settings.delete.desc")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {t("customer.settings.delete.warning")}
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
                      ? t("customer.settings.common.deleting")
                      : t("customer.settings.delete.button")}
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
                      {t("customer.settings.delete.dialogTitle")}
                    </DialogTitle>
                    <DialogDescription>
                      {t("customer.settings.delete.dialogDesc")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="delete-account-password">
                      {t("customer.settings.delete.passwordLabel")}
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
                        "customer.settings.delete.passwordPlaceholder",
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
                      {t("customer.profile.cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      className="text-white"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                    >
                      {deleting
                        ? t("customer.settings.common.deleting")
                        : t("customer.settings.delete.confirm")}
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
