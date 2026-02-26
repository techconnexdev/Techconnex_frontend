import { Metadata } from "next";
import LegalPageLayout from "@/components/legal/LegalPageLayout";
import TermsOfServiceContent from "@/components/legal/TermsOfServiceContent";

export const metadata: Metadata = {
  title: "Terms of Service | TechConnex",
  description:
    "Terms of Service governing your access to and use of TechConnex, an ICT services platform connecting companies with service providers.",
  openGraph: {
    title: "Terms of Service | TechConnex",
    description:
      "Terms of Service governing your access to and use of TechConnex.",
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
