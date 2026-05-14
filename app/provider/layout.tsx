import { ProviderLayout } from "@/components/provider-layout";

/**
 * Single shell for all `/provider/*` routes so the sidebar + header stay mounted
 * on client navigation (no duplicate profile/notification fetches per page).
 */
export default function ProviderSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProviderLayout>{children}</ProviderLayout>;
}
