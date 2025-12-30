// app/layout.tsx
import StripeProvider from "./customer/components/stripeProvider";
import type { Metadata } from "next";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";

export const metadata: Metadata = {
  title: "Techconnex",
  description: "Experience the new standard in collaboration. We use AI-driven insights to bridge the gap between verified talent, universities, and industries... turning chaotic gigs into structured, milestone-based success.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <StripeProvider>{children}</StripeProvider>
      </body>
    </html>
  );
}
