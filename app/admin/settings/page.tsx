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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, DollarSign, Globe } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { toast } from "@/lib/toast";
import { useI18n } from "@/contexts/I18nProvider";
import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALES_LANGUAGE_PICKER,
  type Locale,
} from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages";
import { mergeUserLocaleInStorage, mergeUserPreferredCurrencyInStorage } from "@/lib/userLocale";
import { PREFERRED_CURRENCY_OPTIONS } from "@/lib/currency-options";
import { getUserFriendlyErrorMessage } from "@/lib/errors";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getAuthData() {
  if (typeof window === "undefined") return { token: "", user: null as null | { id?: string } };
  try {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    const user = userJson ? (JSON.parse(userJson) as { id?: string }) : null;
    return { token: token ?? "", user };
  } catch {
    return { token: "", user: null };
  }
}

export default function AdminSettingsPage() {
  const { t, locale, setLocale } = useI18n();
  const [activeTab, setActiveTab] = useState("platform");
  const [settings, setSettings] = useState<Record<string, unknown> | null>(
    null,
  );
  const [platformLoading, setPlatformLoading] = useState(true);
  const [platformSaving, setPlatformSaving] = useState(false);

  const { token, user } = getAuthData();
  const userId = user?.id;

  const [systemLocale, setSystemLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [localePrefsLoading, setLocalePrefsLoading] = useState(false);
  const [localeSaving, setLocaleSaving] = useState(false);
  const [localeMessage, setLocaleMessage] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState("MYR");

  useEffect(() => {
    setSystemLocale(locale === "ar" ? DEFAULT_LOCALE : locale);
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "language" || tab === "platform") setActiveTab(tab);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/settings`);
        const data = await res.json();

        if (data.success && data.data) {
          setSettings(data.data);
        } else {
          console.error("Failed to load settings:", data.message);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setPlatformLoading(false);
      }
    };

    void fetchSettings();
  }, []);

  useEffect(() => {
    if (!userId || !token) return;

    const loadLocalePrefs = async () => {
      setLocalePrefsLoading(true);
      setLocaleMessage("");
      try {
        const res = await fetch(`${API_URL}/settings/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const settingsData = await res.json().catch(() => ({}));
        if (!res.ok) {
          setLocaleMessage(t("admin.settings.locale.loadFailed"));
          return;
        }
        const rawLocale = settingsData.locale;
        if (typeof rawLocale === "string" && isLocale(rawLocale) && rawLocale === "ar") {
          setSystemLocale(DEFAULT_LOCALE);
          setLocale(DEFAULT_LOCALE);
          mergeUserLocaleInStorage(DEFAULT_LOCALE);
        }
        const rawCur = settingsData.preferredCurrency;
        if (
          typeof rawCur === "string" &&
          /^[A-Z]{3}$/.test(rawCur.trim().toUpperCase())
        ) {
          setPreferredCurrency(rawCur.trim().toUpperCase());
        }
      } catch {
        setLocaleMessage(t("admin.settings.locale.loadFailed"));
      } finally {
        setLocalePrefsLoading(false);
      }
    };

    void loadLocalePrefs();
    // Intentionally omit `t` / `setLocale` — stable enough; avoids refetch on i18n churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  const getStringValue = (key: string): string => {
    if (!settings) return "";
    const value = settings[key];
    return typeof value === "string" ? value : "";
  };

  const getNumberValue = (key: string): number => {
    if (!settings) return 0;
    const value = settings[key];
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const platformDefaultLocale: Locale = (() => {
    const raw = getStringValue("defaultLocale");
    return raw && isLocale(raw) ? raw : DEFAULT_LOCALE;
  })();

  /** Dropdown only lists picker locales; if DB still has `ar`, show EN until admin picks EN/ID. */
  const platformDefaultLocaleForSelect: Locale = (
    LOCALES_LANGUAGE_PICKER as readonly string[]
  ).includes(platformDefaultLocale)
    ? platformDefaultLocale
    : DEFAULT_LOCALE;

  const handleInputChange = (key: string, value: unknown) => {
    setSettings((prev: Record<string, unknown> | null) => ({
      ...(prev || {}),
      [key]: value,
    }));
  };

  const handleSavePlatform = async () => {
    if (!settings) return;
    setPlatformSaving(true);

    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(t("admin.settings.platform.toast.saved"));
      } else {
        const msg =
          typeof result.message === "string" && result.message.trim()
            ? result.message.trim()
            : t("admin.settings.platform.toast.saveFailed");
        toast.error(msg);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error(t("admin.settings.platform.toast.saveError"));
    } finally {
      setPlatformSaving(false);
    }
  };

  const handleSaveLocale = async () => {
    if (!userId || !token) return;
    try {
      setLocaleSaving(true);
      setLocaleMessage("");
      const response = await fetch(`${API_URL}/settings/${userId}/locale`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        mergeUserPreferredCurrencyInStorage(preferredCurrency);
        setLocaleMessage(t("settings.language.saved"));
      } else {
        const apiText = [data?.message, data?.error]
          .map((x) => (x != null ? String(x).trim() : ""))
          .find(Boolean);
        setLocaleMessage(
          getUserFriendlyErrorMessage(
            new Error(apiText || `Request failed (${response.status})`),
            "admin settings locale",
          ),
        );
      }
    } catch (error) {
      setLocaleMessage(
        getUserFriendlyErrorMessage(error, "admin settings locale"),
      );
    } finally {
      setLocaleSaving(false);
    }
  };

  if (platformLoading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-gray-500">
          {t("admin.settings.page.loading")}
        </div>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-red-500">
          {t("admin.settings.page.loadFailed")}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("admin.settings.page.title")}
            </h1>
            <p className="text-gray-600">
              {t("admin.settings.page.subtitle")}
            </p>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2 gap-1">
            <TabsTrigger value="platform">
              {t("admin.settings.tab.platform")}
            </TabsTrigger>
            <TabsTrigger value="language">
              {t("admin.settings.tab.language")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="platform" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      {t("admin.settings.platform.general.title")}
                    </CardTitle>
                    <CardDescription>
                      {t("admin.settings.platform.general.description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="platformName">
                          {t("admin.settings.platform.field.platformName")}
                        </Label>
                        <Input
                          id="platformName"
                          value={getStringValue("platformName")}
                          onChange={(e) =>
                            handleInputChange("platformName", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="platformUrl">
                          {t("admin.settings.platform.field.platformUrl")}
                        </Label>
                        <Input
                          id="platformUrl"
                          value={getStringValue("platformUrl")}
                          onChange={(e) =>
                            handleInputChange("platformUrl", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="platformDescription">
                        {t("admin.settings.platform.field.platformDescription")}
                      </Label>
                      <Textarea
                        id="platformDescription"
                        value={getStringValue("platformDescription")}
                        onChange={(e) =>
                          handleInputChange(
                            "platformDescription",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supportEmail">
                          {t("admin.settings.platform.field.supportEmail")}
                        </Label>
                        <Input
                          id="supportEmail"
                          type="email"
                          value={getStringValue("supportEmail")}
                          onChange={(e) =>
                            handleInputChange("supportEmail", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">
                          {t("admin.settings.platform.field.contactPhone")}
                        </Label>
                        <Input
                          id="contactPhone"
                          value={getStringValue("contactPhone")}
                          onChange={(e) =>
                            handleInputChange("contactPhone", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2 max-w-md border-t pt-4 mt-2">
                      <Label htmlFor="platform-default-locale">
                        {t("admin.settings.platform.defaultLocale.label")}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.settings.platform.defaultLocale.description")}
                      </p>
                      <Select
                        value={platformDefaultLocaleForSelect}
                        onValueChange={(v) => {
                          if (isLocale(v))
                            handleInputChange("defaultLocale", v);
                        }}
                      >
                        <SelectTrigger id="platform-default-locale">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Arabic temporarily hidden — restore: map over LOCALES or add
                              <SelectItem value="ar">{t("settings.language.option.ar")}</SelectItem> */}
                          {LOCALES_LANGUAGE_PICKER.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {t(
                                `settings.language.option.${loc}` as MessageKey,
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      {t("admin.settings.platform.financial.title")}
                    </CardTitle>
                    <CardDescription>
                      {t("admin.settings.platform.financial.description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="withdrawalFee">
                          {t("admin.settings.platform.field.withdrawalFee")}
                        </Label>
                        <Input
                          id="withdrawalFee"
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={getNumberValue("withdrawalFee")}
                          onChange={(e) =>
                            handleInputChange(
                              "withdrawalFee",
                              Number.parseFloat(e.target.value),
                            )
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    onClick={() => void handleSavePlatform()}
                    disabled={platformSaving}
                  >
                    {platformSaving ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2" />
                        {t("admin.settings.platform.saving")}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {t("admin.settings.platform.save")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
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
                {!userId ? (
                  <p className="text-sm text-amber-800">
                    {t("admin.settings.locale.signInRequired")}
                  </p>
                ) : localePrefsLoading ? (
                  <p className="text-sm text-gray-600">
                    {t("admin.settings.page.loading")}
                  </p>
                ) : (
                  <>
                    <div className="space-y-2 max-w-md">
                      <Label htmlFor="admin-system-locale">
                        {t("settings.language.label")}
                      </Label>
                      <Select
                        value={systemLocale}
                        onValueChange={(v) => {
                          if (isLocale(v)) setSystemLocale(v);
                        }}
                      >
                        <SelectTrigger id="admin-system-locale">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCALES_LANGUAGE_PICKER.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {t(
                                `settings.language.option.${loc}` as MessageKey,
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 max-w-md border-t pt-4 mt-4">
                      <Label htmlFor="admin-preferred-currency">
                        {t("admin.settings.preferredCurrency.label")}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.settings.preferredCurrency.description")}
                      </p>
                      <Select
                        value={preferredCurrency}
                        onValueChange={setPreferredCurrency}
                      >
                        <SelectTrigger id="admin-preferred-currency">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PREFERRED_CURRENCY_OPTIONS.map((code) => (
                            <SelectItem key={code} value={code}>
                              {code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => void handleSaveLocale()}
                        disabled={localeSaving}
                      >
                        {localeSaving
                          ? t("customer.settings.common.saving")
                          : t("settings.language.save")}
                      </Button>
                    </div>
                  </>
                )}
                {localeMessage ? (
                  <p className="text-sm text-gray-600">{localeMessage}</p>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
