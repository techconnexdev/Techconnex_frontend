import { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import CookieNoticeContent from "@/components/legal/CookieNoticeContent";

export const metadata: Metadata = {
  title: "Cookie Notice | TechConnex",
  description:
    "Cookie Notice explaining how TechConnex uses cookies and similar technologies. Essential cookies only, no advertising or tracking.",
  openGraph: {
    title: "Cookie Notice | TechConnex",
    description: "How TechConnex uses cookies and similar technologies.",
    url: "https://techconnex.vip/cookies",
  },
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <LegalPageLayout>
      <CookieNoticeContent />
    </LegalPageLayout>
  );
}
