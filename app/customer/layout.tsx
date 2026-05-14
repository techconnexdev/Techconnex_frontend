import { CustomerLayout } from "@/components/customer-layout";

/**
 * Single shell for all `/customer/*` routes so the sidebar + header stay mounted
 * on client navigation (no duplicate profile/notification fetches per page).
 */
export default function CustomerSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerLayout>{children}</CustomerLayout>;
}
