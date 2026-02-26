"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface AdminSettings {
  platformName?: string;
  platformDescription?: string;
  supportEmail?: string;
  contactPhone?: string;
}

const Footer = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${API_URL}/admin/settings`);
        const data = await res.json();

        if (data.success && data.data) {
          setSettings(data.data);
        } else {
          console.error("Failed to load settings:", data.message);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };

    fetchSettings();
  }, []);

  // Fallback values if settings are not loaded
  const platformName = settings?.platformName || "TechConnex";
  const platformDescription =
    settings?.platformDescription ||
    "Connecting technology professionals with opportunities. Your trusted platform for tech services, talent, and innovation.";
  const supportEmail = settings?.supportEmail || "info@techconnex.com";
  const contactPhone = settings?.contactPhone || "+1 (234) 567-890";

  return (
    <footer className="relative py-8 bg-gradient-to-b from-blue-50/60 to-blue-100/80 text-gray-900 overflow-hidden border-t border-blue-200/40">
      {/* Soft top edge to blend from WobbleCard */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-200/50 to-transparent" aria-hidden />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-6">
          {/* Platform Name and Description */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h3 className="text-2xl font-bold mb-3">{platformName}</h3>
            <p className="text-gray-600 text-sm leading-relaxed max-w-md">
              {platformDescription}
            </p>
          </div>

          {/* Contact Information */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2 text-gray-900">
                Contact Us
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="text-gray-600 hover:text-gray-900 transition text-sm"
                  >
                    {supportEmail}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <a
                    href={`tel:${contactPhone.replace(/\s/g, "")}`}
                    className="text-gray-600 hover:text-gray-900 transition text-sm"
                  >
                    {contactPhone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal links & Copyright */}
        <div className="border-t border-blue-200/40 pt-6">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-600 mb-3">
            <Link href="/privacy" className="hover:text-gray-900 transition">
              Privacy Policy
            </Link>
            <span aria-hidden>·</span>
            <Link href="/terms" className="hover:text-gray-900 transition">
              Terms of Service
            </Link>
            <span aria-hidden>·</span>
            <Link href="/cookies" className="hover:text-gray-900 transition">
              Cookie Policy
            </Link>
          </div>
          <div className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} CYBERNET CONSULTING SDN. BHD. All rights
            reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
