import { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import PrivacyPolicyContent from "@/components/legal/PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "Privacy Policy | TechConnex",
  description:
    "Privacy Policy describing how TechConnex collects, stores, uses, and shares your personal information. PDPA and GDPR aligned.",
  openGraph: {
    title: "Privacy Policy | TechConnex",
    description:
      "How TechConnex collects, uses, and protects your personal data.",
    url: "https://techconnex.vip/privacy",
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout>
      <PrivacyPolicyContent />
    </LegalPageLayout>
  );
}
