import { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import PrivacyPolicyContent from "@/components/legal/PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | Privacy Policy | TechConnex",
  description:
    "Kebijakan Privasi yang menjelaskan bagaimana TechConnex mengumpulkan, menyimpan, menggunakan, dan membagikan data pribadi Anda.",
  openGraph: {
    title: "Kebijakan Privasi | Privacy Policy | TechConnex",
    description:
      "Bagaimana TechConnex mengumpulkan, menggunakan, dan melindungi data pribadi Anda.",
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
