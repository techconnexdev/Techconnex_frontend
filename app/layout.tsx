// app/layout.tsx
import StripeProvider from "./customer/components/stripeProvider";
import CookieConsentBanner from "@/components/legal/CookieConsentBanner";
import { Toaster } from "@/components/ui/toaster";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AuthSessionGuard } from "@/components/AuthSessionGuard";
import type { Metadata, Viewport } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
const siteUrl = "https://techconnex.vip";

export const viewport: Viewport = {
  themeColor: "#1E40AF",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Techconnex",
  description: "Techconnex is an AI freelancing platform connecting talented freelancers with businesses worldwide. Find projects, collaborate, and grow your career.",
  keywords: ['freelancing', 'Techconnex', 'remote work', 'hire freelancers', 'projects', 'jobs', 'gig economy'],
  authors: [{ name: 'Techconnex', url: siteUrl }],
  creator: 'Techconnex',
  publisher: 'Techconnex',
  icons: {
    icon: [
      { url: `${siteUrl}/favicon.ico`, sizes: "any" },
      { url: `${siteUrl}/favicon.ico`, type: "image/x-icon" },
    ],
    apple: `${siteUrl}/favicon.ico`,
  },
  openGraph: {
    title: 'Techconnex - Freelancing Platform',
    description: 'Techconnex is an AI freelancing platform connecting talented freelancers with businesses worldwide.',
    url: siteUrl,
    siteName: 'Techconnex',
    images: [
      {
        url: '/og-image.png', // Add your Open Graph image in public folder
        width: 1200,
        height: 630,
        alt: 'Techconnex Freelancing Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Techconnex - Freelancing Platform',
    description: 'Techconnex is an AI freelancing platform connecting talented freelancers with businesses worldwide.',
    site: '@Techconnex', // your Twitter handle
    creator: '@Techconnex', // your Twitter handle
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <Analytics />
      <body className="antialiased">
        <AuthSessionGuard />
        <OfflineProvider>
          <OfflineBanner />
          <StripeProvider>
            {children}
            <CookieConsentBanner />
            <Toaster />
          </StripeProvider>
        </OfflineProvider>
      </body>
    </html>
  );
}
