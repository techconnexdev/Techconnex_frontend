import BetaBanner from "@/components/BetaBanner";
import Footer from "@/components/Homepage/Footer";
import Header from "@/components/Homepage/Header";

export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate min-h-screen">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[90]">
        <div className="pointer-events-auto">
          <BetaBanner />
          <Header />
        </div>
      </div>
      <main className="overflow-x-hidden">{children}</main>
      <Footer />
    </div>
  );
}
