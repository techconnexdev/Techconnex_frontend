import Link from "next/link";
import BetaBanner from "@/components/BetaBanner";
import Footer from "@/components/Homepage/Footer";
import Header from "@/components/Homepage/Header";

export type PublicDirectoryNavLink = {
  href: string;
  label: string;
  active?: boolean;
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  count: number;
  countLabel: string;
  links: PublicDirectoryNavLink[];
  children: React.ReactNode;
};

export default function PublicDirectoryShell({
  eyebrow,
  title,
  description,
  count,
  countLabel,
  links,
  children,
}: Props) {
  return (
    <div className="relative isolate min-h-screen bg-slate-50/50">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[90]">
        <div className="pointer-events-auto">
          <BetaBanner />
          <Header />
        </div>
      </div>
      <main className="overflow-x-hidden">
        <section className="mx-auto max-w-7xl px-6 pt-28 pb-12 md:px-12 md:pt-32 md:pb-16">
          <div className="mb-10 flex flex-col gap-8 md:mb-14 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-600">
                {eyebrow}
              </p>
              <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                {title}
              </h1>
              <p className="text-lg leading-relaxed text-slate-600">{description}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-6">
              <div className="inline-flex flex-col rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200/80">
                <span className="text-3xl font-extrabold tabular-nums text-slate-900">
                  {count}
                </span>
                <span className="text-sm font-semibold text-slate-500">{countLabel}</span>
              </div>
              <nav className="flex flex-wrap gap-2" aria-label="Directory">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      link.active
                        ? "rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-md"
                        : "rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    }
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          {children}
        </section>
      </main>
      <Footer />
    </div>
  );
}
