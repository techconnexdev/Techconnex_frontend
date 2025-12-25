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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Save,
  Shield,
  Bell,
  DollarSign,
  Mail,
  Globe,
  AlertTriangle,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Fetch settings from backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:4000/admin/settings");
        const data = await res.json();

        if (data.success && data.data) {
          setSettings(data.data);
        } else {
          console.error("Failed to load settings:", data.message);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // ✅ Helper functions to safely get typed values
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
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const getBooleanValue = (key: string): boolean => {
    if (!settings) return false;
    const value = settings[key];
    return typeof value === "boolean" ? value : false;
  };

  // ✅ Handle input updates
  const handleInputChange = (key: string, value: unknown) => {
    setSettings((prev: Record<string, unknown> | null) => ({
      ...(prev || {}),
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      const res = await fetch("http://localhost:4000/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const result = await res.json();
      if (result.success) {
        toast.success("✅ Settings saved successfully!");
      } else {
        toast.error(result.message || "⚠️ Failed to save settings");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("❌ Error saving settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-gray-500">Loading settings...</div>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout>
        <div className="p-8 text-center text-red-500">
          Failed to load settings from backend.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Platform Settings
            </h1>
            <p className="text-gray-600">
              Configure platform-wide settings and preferences
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Settings Navigation */}
          {/* <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Settings Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  General
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Financial
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Email & SMS
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Security
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Globe className="w-4 h-4 mr-2" />
                  Features
                </Button>
              </CardContent>
            </Card>
          </div> */}

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  General Settings
                </CardTitle>
                <CardDescription>Basic platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Platform Name</Label>
                    <Input
                      id="platformName"
                      value={getStringValue("platformName")}
                      onChange={(e) =>
                        handleInputChange("platformName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platformUrl">Platform URL</Label>
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
                    Platform Description
                  </Label>
                  <Textarea
                    id="platformDescription"
                    value={getStringValue("platformDescription")}
                    onChange={(e) =>
                      handleInputChange("platformDescription", e.target.value)
                    }
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
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
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={getStringValue("contactPhone")}
                      onChange={(e) =>
                        handleInputChange("contactPhone", e.target.value)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Settings
                </CardTitle>
                <CardDescription>
                  Commission rates and payment configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platformCommission">
                      Platform Commission (%)
                    </Label>
                    <Input
                      id="platformCommission"
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={getNumberValue("platformCommission")}
                      onChange={(e) =>
                        handleInputChange(
                          "platformCommission",
                          Number.parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawalFee">Withdrawal Fee (%)</Label>
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
                          Number.parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minimumWithdrawal">
                      Minimum Withdrawal (RM)
                    </Label>
                    <Input
                      id="minimumWithdrawal"
                      type="number"
                      min="50"
                      value={getNumberValue("minimumWithdrawal")}
                      onChange={(e) =>
                        handleInputChange(
                          "minimumWithdrawal",
                          Number.parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentProcessingTime">
                      Payment Processing (Days)
                    </Label>
                    <Input
                      id="paymentProcessingTime"
                      type="number"
                      min="1"
                      max="14"
                      value={getNumberValue("paymentProcessingTime")}
                      onChange={(e) =>
                        handleInputChange(
                          "paymentProcessingTime",
                          Number.parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  SMTP settings for email delivery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={getStringValue("smtpHost")}
                      onChange={(e) =>
                        handleInputChange("smtpHost", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={getNumberValue("smtpPort")}
                      onChange={(e) =>
                        handleInputChange(
                          "smtpPort",
                          Number.parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpUsername">SMTP Username</Label>
                  <Input
                    id="smtpUsername"
                    value={getStringValue("smtpUsername")}
                    onChange={(e) =>
                      handleInputChange("smtpUsername", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={getStringValue("smtpPassword")}
                    onChange={(e) =>
                      handleInputChange("smtpPassword", e.target.value)
                    }
                    placeholder="Enter SMTP password"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure platform-wide notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Send email notifications to users
                    </p>
                  </div>
                  <Switch
                    checked={getBooleanValue("emailNotifications")}
                    onCheckedChange={(checked) =>
                      handleInputChange("emailNotifications", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Send SMS notifications for critical updates
                    </p>
                  </div>
                  <Switch
                    checked={getBooleanValue("smsNotifications")}
                    onCheckedChange={(checked) =>
                      handleInputChange("smsNotifications", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Send browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={getBooleanValue("pushNotifications")}
                    onCheckedChange={(checked) =>
                      handleInputChange("pushNotifications", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-gray-500">
                      Send promotional and marketing emails
                    </p>
                  </div>
                  <Switch
                    checked={getBooleanValue("marketingEmails")}
                    onCheckedChange={(checked) =>
                      handleInputChange("marketingEmails", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Platform security and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">
                      Force 2FA for all admin accounts
                    </p>
                  </div>
                  <Switch
                    checked={getBooleanValue("twoFactorRequired")}
                    onCheckedChange={(checked) =>
                      handleInputChange("twoFactorRequired", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="5"
                      max="480"
                      value={getNumberValue("sessionTimeout")}
                      onChange={(e) =>
                        handleInputChange(
                          "sessionTimeout",
                          Number.parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">
                      Minimum Password Length
                    </Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      min="6"
                      max="20"
                      value={getNumberValue("passwordMinLength")}
                      onChange={(e) =>
                        handleInputChange(
                          "passwordMinLength",
                          Number.parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    value={getNumberValue("maxLoginAttempts")}
                    onChange={(e) =>
                      handleInputChange(
                        "maxLoginAttempts",
                        Number.parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Feature Flags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Feature Management
                </CardTitle>
                <CardDescription>
                  Enable or disable platform features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      Maintenance Mode
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    </Label>
                    <p className="text-sm text-gray-500">
                      Put platform in maintenance mode
                    </p>
                  </div>
                  <Switch
                    checked={getBooleanValue("maintenanceMode")}
                    onCheckedChange={(checked) =>
                      handleInputChange("maintenanceMode", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New User Registrations</Label>
                    <p className="text-sm text-gray-500">
                      Allow new users to register
                    </p>
                  </div>
                  <Switch
                    checked={getBooleanValue("newRegistrations")}
                    onCheckedChange={(checked) =>
                      handleInputChange("newRegistrations", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Project Creation</Label>
                    <p className="text-sm text-gray-500">
                      Allow customers to create new projects
                    </p>
                  </div>
                  <Switch
                    checked={getBooleanValue("projectCreation")}
                    onCheckedChange={(checked) =>
                      handleInputChange("projectCreation", checked)
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Processing</Label>
                    <p className="text-sm text-gray-500">
                      Enable payment processing and withdrawals
                    </p>
                  </div>
                  <Switch
                    checked={getBooleanValue("paymentProcessing")}
                    onCheckedChange={(checked) =>
                      handleInputChange("paymentProcessing", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white mr-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
