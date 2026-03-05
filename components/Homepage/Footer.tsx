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

  const socialLinks = [
    {
      name: "X (Twitter)",
      href: "https://x.com/Techconnexhq",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/techconnexhq/",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/techconnexhq/",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "TikTok",
      href: "https://www.tiktok.com/@techconnexhq",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      ),
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/@Techconnexhq",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
  ];

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

        {/* Social media links */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-4 border-t border-blue-200/40">
          {socialLinks.map(({ name, href, icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:text-gray-900 hover:bg-blue-100/80 transition-colors"
              aria-label={`Follow us on ${name}`}
            >
              {icon}
            </a>
          ))}
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
