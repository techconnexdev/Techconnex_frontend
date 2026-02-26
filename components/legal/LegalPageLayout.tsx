import Header from "@/components/Homepage/Header";
import Footer from "@/components/Homepage/Footer";

export default function LegalPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-x-hidden py-10 md:py-14">
        <div className="container mx-auto px-4">
          <article className="mx-auto max-w-3xl prose prose-slate dark:prose-invert prose-headings:font-semibold prose-a:text-blue-600 hover:prose-a:text-blue-700">
            {children}
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
