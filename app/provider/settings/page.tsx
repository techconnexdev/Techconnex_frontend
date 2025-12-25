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
import { Bell, Shield, CreditCard, Trash2 } from "lucide-react";
import Loading from "../projects/loading";
import { ProviderLayout } from "@/components/provider-layout";

type NotificationSettings = {
  emailNotifications: boolean;
  smsNotifications: boolean;
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
  status: string;
  createdAt: string;
};

export default function CustomerSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  const handleDeleteAccount = async () => {
    // Step 1: Confirm user intention
    const confirmDelete = window.confirm(
      "⚠️ Are you sure you want to permanently delete your account? This action cannot be undone."
    );
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      setDeleteMessage("");

      // Step 2: Call backend DELETE endpoint
      const response = await fetch(`${API_URL}/settings/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Step 3: Handle response
      if (response.ok) {
        setDeleteMessage("✅ Account deleted successfully. Logging out...");

        // Step 4: Clear session & redirect
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          sessionStorage.clear();
          window.location.href = "/auth/login"; // Redirect to login page
        }, 2000);
      } else {
        const data = await response.json();
        setDeleteMessage(data.message || "❌ Failed to delete account.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteMessage("❌ Something went wrong while deleting account.");
    } finally {
      setDeleting(false);
    }
  };


  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      setMessage("");
      const response = await fetch(
        `${API_URL}/settings/${userId}/notifications`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(notifications),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("✅ Notification preferences updated successfully!");
      } else {
        setMessage(
          `❌ Failed to update notifications: ${data.message || "Error"}`
        );
      }
    } catch (error) {
      console.error("Error updating notifications:", error);
      setMessage("❌ Something went wrong.");
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
        setMessage("✅ Privacy settings updated successfully!");
      } else {
        setMessage(`❌ Failed to update privacy: ${data.message || "Error"}`);
      }
    } catch (error) {
      console.error("Error updating privacy:", error);
      setMessage("❌ Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please fill in all password fields.");
      setPasswordSuccess(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
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
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess(true);
        setPasswordMessage("Password updated successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordSuccess(false);
        setPasswordMessage(data.message || "Failed to update password.");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordSuccess(false);
      setPasswordMessage("Something went wrong.");
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

  // 🔹 Fetch settings and payment info
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, paymentsRes] = await Promise.all([
          fetch(`${API_URL}/settings/${userId}`),
          fetch(`${API_URL}/settings/${userId}/payments`),
        ]);

        const settingsData = await settingsRes.json();
        const paymentsData = await paymentsRes.json();

        setNotifications({
          emailNotifications: settingsData.emailNotifications,
          smsNotifications: settingsData.smsNotifications,
          projectUpdates: settingsData.projectUpdates,
          marketingEmails: settingsData.marketingEmails,
          weeklyReports: settingsData.weeklyReports,
        });

        setPrivacy({
          profileVisibility: settingsData.profileVisibility,
          showEmail: settingsData.showEmail,
          showPhone: settingsData.showPhone,
          allowMessages: settingsData.allowMessages,
        });

        setPayments(paymentsData);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId && API_URL) {
      fetchData();
    }
  }, [userId, API_URL]);

  if (loading) return Loading();

  return (
    <ProviderLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="privacy" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            {/* <TabsTrigger value="notifications">Notifications</TabsTrigger> */}
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            {/* <TabsTrigger value="billing">Billing</TabsTrigger> */}
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notifications?.emailNotifications ?? false}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          emailNotifications: checked,
                        } as NotificationSettings)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">
                        SMS Notifications
                      </Label>
                      <p className="text-sm text-gray-500">
                        Receive urgent notifications via SMS
                      </p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={notifications?.smsNotifications ?? false}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          smsNotifications: checked,
                        } as NotificationSettings)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="project-updates">Project Updates</Label>
                      <p className="text-sm text-gray-500">
                        Get notified about project milestones and updates
                      </p>
                    </div>
                    <Switch
                      id="project-updates"
                      checked={notifications?.projectUpdates ?? false}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          projectUpdates: checked,
                        } as NotificationSettings)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing-emails">Marketing Emails</Label>
                      <p className="text-sm text-gray-500">
                        Receive updates about new features and promotions
                      </p>
                    </div>
                    <Switch
                      id="marketing-emails"
                      checked={notifications?.marketingEmails ?? false}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          marketingEmails: checked,
                        } as NotificationSettings)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weekly-reports">Weekly Reports</Label>
                      <p className="text-sm text-gray-500">
                        Get weekly summaries of your projects
                      </p>
                    </div>
                    <Switch
                      id="weekly-reports"
                      checked={notifications?.weeklyReports ?? false}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          weeklyReports: checked,
                        } as NotificationSettings)
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={saving}>
                    {saving ? "Saving..." : "Save Preferences"}
                  </Button>
                </div>
                {message && (
                  <p className="text-sm text-gray-600 mt-2">{message}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control your privacy and data sharing preferences
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
                      <Label htmlFor="show-email">Show Email Address</Label>
                      <p className="text-sm text-gray-500">
                        Allow providers to see your email address
                      </p>
                    </div>
                    <Switch
                      id="show-email"
                      checked={privacy?.showEmail ?? false}
                      onCheckedChange={(checked) =>
                        setPrivacy({ ...privacy, showEmail: checked } as PrivacySettings)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-phone">Show Phone Number</Label>
                      <p className="text-sm text-gray-500">
                        Allow providers to see your phone number
                      </p>
                    </div>
                    <Switch
                      id="show-phone"
                      checked={privacy?.showPhone ?? false}
                      onCheckedChange={(checked) =>
                        setPrivacy({ ...privacy, showPhone: checked } as PrivacySettings)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-messages">
                        Allow Direct Messages
                      </Label>
                      <p className="text-sm text-gray-500">
                        Let providers contact you directly
                      </p>
                    </div>
                    <Switch
                      id="allow-messages"
                      checked={privacy?.allowMessages ?? false}
                      onCheckedChange={(checked) =>
                        setPrivacy({ ...privacy, allowMessages: checked } as PrivacySettings)
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSavePrivacy} disabled={saving}>
                    {saving ? "Saving..." : "Save Settings"}
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
                    Payment Methods
                  </CardTitle>
                  <CardDescription>
                    Manage your payment methods and billing information
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
                              RM {p.amount.toFixed(2)}
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
                    <p className="text-sm text-gray-500">No payments found.</p>
                  )}

                  <Button variant="outline" className="w-full bg-transparent">
                    Add New Payment Method
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
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Password fields */}
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
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
                    {loadingPassword ? "Updating..." : "Update Password"}
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
                    Delete Account
                  </CardTitle>
                  <CardDescription>
                    Permanently delete your account and all associated data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    This action cannot be undone. All your projects, messages,
                    and data will be permanently deleted.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="mt-4"
                  >
                    {deleting ? "Deleting..." : "Delete Account"}
                  </Button>

                  {deleteMessage && (
                    <p className="text-sm text-gray-600 mt-2">
                      {deleteMessage}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ProviderLayout>
  );
}
