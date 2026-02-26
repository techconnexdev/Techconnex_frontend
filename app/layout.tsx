// app/layout.tsx
import StripeProvider from "./customer/components/stripeProvider";
import CookieConsentBanner from "@/components/legal/CookieConsentBanner";
import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";

export const metadata: Metadata = {
  title: "Techconnex",
  description: "Techconnex is an AI freelancing platform connecting talented freelancers with businesses worldwide. Find projects, collaborate, and grow your career.",
  keywords: ['freelancing', 'Techconnex', 'remote work', 'hire freelancers', 'projects', 'jobs', 'gig economy'],
  authors: [{ name: 'Techconnex', url: 'https://www.techconnex.vip' }],
  creator: 'Techconnex',
  publisher: 'Techconnex',
  themeColor: '#1E40AF', // your brand color
  openGraph: {
    title: 'Techconnex - Freelancing Platform',
    description: 'Techconnex is an AI freelancing platform connecting talented freelancers with businesses worldwide.',
    url: 'https://www.techconnex.vip',
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
      <body className="antialiased">
        <StripeProvider>
          {children}
          <CookieConsentBanner />
        </StripeProvider>
      </body>
    </html>
  );
}
