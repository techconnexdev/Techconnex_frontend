import { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import TermsOfServiceContent from "@/components/legal/TermsOfServiceContent";

export const metadata: Metadata = {
  title: "Syarat Layanan | Terms of Service | TechConnex",
  description:
    "Syarat Layanan yang mengatur akses dan penggunaan TechConnex, platform layanan ICT yang menghubungkan perusahaan dengan penyedia layanan.",
  openGraph: {
    title: "Syarat Layanan | Terms of Service | TechConnex",
    description:
      "Syarat Layanan TechConnex untuk akses dan penggunaan platform.",
    url: "https://techconnex.vip/terms",
  },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPageLayout>
      <TermsOfServiceContent />
    </LegalPageLayout>
  );
}
