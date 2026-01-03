"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Camera, Globe, X, Plus, Loader2, Calendar, Facebook, Instagram, Linkedin, Twitter, Youtube, Link2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState, useRef } from "react";
import type { ProfileData } from "../types";
import { uploadCompanyProfileImage, getCompanyProfileCompletion, getProfileImageUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type Props = {
  value: ProfileData;
  onChange: (next: ProfileData) => void;
  isEditing: boolean;
  onCompletionUpdate?: (completion: number, suggestions: string[]) => void;
  memberSince?: string;
};

export default function ProfileOverview({ value, onChange, isEditing, onCompletionUpdate, memberSince }: Props) {
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Helper to handle array inputs (socialLinks, languages)
  const handleArrayInput = (field: "socialLinks" | "languages", newValue: string[]) => {
    onChange({
      ...value,
      customerProfile: {
        ...value.customerProfile || {},
        [field]: newValue,
      },
    });
  };

  const addArrayItem = (field: "socialLinks" | "languages", item: string) => {
    if (!item.trim()) return;
    const current = value.customerProfile?.[field] || [];
    if (!current.includes(item.trim())) {
      handleArrayInput(field, [...current, item.trim()]);
    }
    // Clear input after adding
    if (field === "socialLinks") setNewSocialUrl("");
    if (field === "languages") setNewLanguage("");
  };

  const removeArrayItem = (field: "socialLinks" | "languages", index: number) => {
    const current = value.customerProfile?.[field] || [];
    handleArrayInput(field, current.filter((_, i) => i !== index));
  };

  const handleAddSocialUrl = () => {
    if (newSocialUrl.trim() && !value.customerProfile?.socialLinks?.includes(newSocialUrl.trim())) {
      addArrayItem("socialLinks", newSocialUrl.trim());
    }
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim() && !value.customerProfile?.languages?.includes(newLanguage.trim())) {
      addArrayItem("languages", newLanguage.trim());
    }
  };

  // Helper function to detect social media platform and return icon
  const getSocialIcon = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("facebook")) return Facebook;
    if (lowerUrl.includes("instagram")) return Instagram;
    if (lowerUrl.includes("linkedin")) return Linkedin;
    if (lowerUrl.includes("twitter") || lowerUrl.includes("x.com")) return Twitter;
    if (lowerUrl.includes("youtube")) return Youtube;
    return Link2;
  };

  // Helper function to get platform name
  const getPlatformName = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("facebook")) return "Facebook";
    if (lowerUrl.includes("instagram")) return "Instagram";
    if (lowerUrl.includes("linkedin")) return "LinkedIn";
    if (lowerUrl.includes("twitter") || lowerUrl.includes("x.com")) return "Twitter/X";
    if (lowerUrl.includes("youtube")) return "YouTube";
    return "Website";
  };

  // Helper function to format URL for display
  const formatSocialUrl = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, GIF, or WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const result = await uploadCompanyProfileImage(file);
      onChange({
        ...value,
        customerProfile: {
          ...value.customerProfile || {},
          profileImageUrl: result.data.profileImageUrl,
        } as Record<string, unknown>,
      });
      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      });
      // Reload completion percentage and suggestions
      if (onCompletionUpdate) {
        try {
          const completionResponse = await getCompanyProfileCompletion();
          if (completionResponse.success) {
            onCompletionUpdate(
              completionResponse.data.completion || 0,
              completionResponse.data.suggestions || []
            );
          }
        } catch (error) {
          console.error("Failed to fetch completion:", error);
        }
      }
    } catch (error: unknown) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload profile image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Profile Overview</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your public profile information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-5 lg:space-y-6 p-4 sm:p-6 pt-0">
        {/* Avatar & Basic */}
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 lg:gap-6">
          <div className="relative mx-auto sm:mx-0">
            <Avatar className="w-20 h-20 sm:w-22 sm:h-22 lg:w-24 lg:h-24">
                <AvatarImage 
                  src={getProfileImageUrl(value.customerProfile?.profileImageUrl)} 
                />
              <AvatarFallback className="text-base sm:text-lg">
                {value.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'CO'}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button 
                    size="sm" 
                    className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 rounded-full w-7 h-7 sm:w-8 sm:h-8 p-0"
                    onClick={handleImageClick}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
              </Button>
                </>
            )}
          </div>
          <div className="flex-1 space-y-3 sm:space-y-4 w-full">
            <div>
              <Label htmlFor="companyName" className="text-sm sm:text-base">Company Name</Label>
              {isEditing ? (
                <>
              <Input
                id="companyName"
                value={value.name}
                  disabled={true}
                  className="bg-gray-50 text-sm sm:text-base"
              />
                <p className="text-xs text-gray-500 mt-1">Contact support to change company name</p>
                </>
              ) : (
                <p className="text-sm sm:text-base text-gray-900 mt-2">{value.name || "N/A"}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description" className="text-sm sm:text-base">Company Description</Label>
              {isEditing ? (
              <Textarea
                id="description"
                  rows={4}
                  value={value.customerProfile?.description || ""}
                onChange={(e) => onChange({ 
                  ...value, 
                  customerProfile: { 
                      ...value.customerProfile || {}, 
                    description: e.target.value 
                  } 
                })}
                placeholder="Tell us about your company..."
                className="text-sm sm:text-base"
              />
              ) : (
                <p className="text-sm sm:text-base text-gray-900 mt-2 whitespace-pre-wrap">
                  {value.customerProfile?.description || "No description provided"}
                </p>
              )}
            </div>
              {memberSince && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Member since {memberSince}</span>
                </div>
              )}
          </div>
        </div>

        <Separator />

        {/* Contact */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-semibold">Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
              {isEditing ? (
                <>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                    className="pl-10 bg-gray-50 text-sm sm:text-base"
                  value={value.email}
                    disabled={true}
                />
              </div>
                <p className="text-xs text-gray-500 mt-1">Contact support to change email</p>
                </>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <Mail className="text-gray-400 w-4 h-4" />
                  <p className="text-sm sm:text-base text-gray-900">{value.email || "N/A"}</p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm sm:text-base">Phone</Label>
              {isEditing ? (
                <>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="phone"
                    className="pl-10 bg-gray-50 text-sm sm:text-base"
                    value={value.phone || ""}
                    disabled={true}
                />
              </div>
                <p className="text-xs text-gray-500 mt-1">Contact support to change phone</p>
                </>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <Phone className="text-gray-400 w-4 h-4" />
                  <p className="text-sm sm:text-base text-gray-900">{value.phone || "N/A"}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

          {/* Location & Website */}
        <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold">Location & Website</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label htmlFor="location" className="text-sm sm:text-base">Location</Label>
            {isEditing ? (
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="location"
                className="pl-10 text-sm sm:text-base"
                    value={value.customerProfile?.location || ""}
                onChange={(e) => onChange({ 
                  ...value, 
                  customerProfile: { 
                        ...value.customerProfile || {}, 
                    location: e.target.value 
                  } 
                })}
                    placeholder="Kuala Lumpur, Malaysia"
              />
            </div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="text-gray-400 w-4 h-4" />
                <p className="text-sm sm:text-base text-gray-900">
                  {value.customerProfile?.location || "N/A"}
                </p>
              </div>
            )}
          </div>
              <div>
                <Label htmlFor="website" className="text-sm sm:text-base">Website</Label>
                {isEditing ? (
                  <>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="website"
                    type="url"
                    className="pl-10 text-sm sm:text-base"
                    value={value.customerProfile?.website || ""}
                    onChange={(e) => onChange({ 
                      ...value, 
                      customerProfile: { 
                        ...value.customerProfile || {}, 
                        website: e.target.value 
                      } 
                    })}
                    placeholder="https://your-company.com"
                  />
                    </div>
                  <p className="text-xs text-gray-500 mt-1">You can enter with or without https://</p>
                  </>
                ) : (
                  <div className="mt-2">
                    {value.customerProfile?.website ? (
                      <a
                        href={value.customerProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all duration-200 group"
                      >
                        <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                          <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {value.customerProfile.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                          </p>
                        </div>
                      </a>
                    ) : (
                      <p className="text-sm sm:text-base text-gray-500 italic">N/A</p>
                    )}
                </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Social Links */}
          {isEditing && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Social Links</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Add links to LinkedIn, Facebook, Instagram, Twitter, or other social media profiles
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  placeholder="https://linkedin.com/yourusername"
                  type="url"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddSocialUrl())
                  }
                  className="text-sm sm:text-base flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddSocialUrl}
                  variant="outline"
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>

              {value.customerProfile?.socialLinks && value.customerProfile.socialLinks.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base font-medium">
                    Social Links ({value.customerProfile.socialLinks.length})
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {value.customerProfile.socialLinks.map((url, index) => {
                      const IconComponent = getSocialIcon(url);
                      const platformName = getPlatformName(url);
                      const displayUrl = formatSocialUrl(url);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 group"
                        >
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 group-hover:text-blue-600 transition-colors"
                          >
                            <div className="flex-shrink-0 p-1.5 sm:p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 group-hover:text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                {platformName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {displayUrl}
                              </p>
                            </div>
                          </a>
                          <button
                            type="button"
                            onClick={() => removeArrayItem("socialLinks", index)}
                            className="ml-2 sm:ml-3 flex-shrink-0 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            aria-label="Remove social link"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!value.customerProfile?.socialLinks || value.customerProfile.socialLinks.length === 0) && (
                <div className="text-center py-6 sm:py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <Globe className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-sm sm:text-base font-medium mb-1">No social links added yet</p>
                  <p className="text-xs sm:text-sm">
                    Add links to showcase your company&apos;s social media presence
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Display social links when not editing */}
          {!isEditing && value.customerProfile?.socialLinks && value.customerProfile.socialLinks.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Social Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {value.customerProfile.socialLinks.map((link, index) => {
                  const IconComponent = getSocialIcon(link);
                  const platformName = getPlatformName(link);
                  const displayUrl = formatSocialUrl(link);
                  return (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all duration-200 group"
                    >
                      <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {platformName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {displayUrl}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Languages */}
          {isEditing && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Languages</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Add languages spoken in your company
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="English, Bahasa Malaysia, Mandarin..."
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddLanguage())
                  }
                  className="text-sm sm:text-base flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddLanguage}
                  variant="outline"
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>

              {value.customerProfile?.languages && value.customerProfile.languages.length > 0 && (
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base font-medium">
                    Languages ({value.customerProfile.languages.length})
                  </Label>
                  <div className="flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg bg-gray-50">
                    {value.customerProfile.languages.map((lang, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => removeArrayItem("languages", index)}
                          className="ml-0.5 hover:text-red-600 transition-colors"
                          aria-label="Remove language"
                        >
                          <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Display languages when not editing */}
          {!isEditing && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Languages</h3>
              {value.customerProfile?.languages && value.customerProfile.languages.length > 0 ? (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {value.customerProfile.languages.map((lang, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="px-3 py-1.5 text-xs sm:text-sm bg-blue-100 text-blue-800"
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm sm:text-base text-gray-500 italic">No languages added yet</p>
              )}
            </div>
          )}
      </CardContent>
    </Card>
    </div>
  );
}
