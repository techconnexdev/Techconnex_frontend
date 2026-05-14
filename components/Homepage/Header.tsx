"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import MenuIcon from "@/public/assets/icon-menu.svg";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/contexts/I18nProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

function getDashboardHref(): string | null {
  if (typeof window === "undefined") return null;
  const userJson = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  if (!userJson || !token) return null;
  try {
    const userData = JSON.parse(userJson);
    const roles = Array.isArray(userData?.role) ? userData.role : userData?.role ? [userData.role] : [];
    if (roles.includes("ADMIN")) return "/admin/dashboard";
    if (roles.includes("PROVIDER")) return "/provider/dashboard";
    if (roles.includes("CUSTOMER")) return "/customer/dashboard";
  } catch {
    // ignore
  }
  return null;
}

const Header = () => {
  const { t } = useI18n();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const navItems = [
    { id: "about", label: "Video" },
    { id: "showcase", label: "Showcase" },
    { id: "steps", label: "Steps" },
    { id: "features", label: "Features" },
    { id: "ai-intelligence", label: "Intelligence" },
    // { id: "get-started", label: "Get Started" },
  ] as const;

  useEffect(() => {
    setDashboardHref(getDashboardHref());
  }, [pathname]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Approximate header height for offset
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (sectionId: string) => {
    if (sectionId === "showcase") {
      setIsMobileMenuOpen(false);
      window.location.href = "/showcase";
      return;
    }

    if (isHomePage) {
      scrollToSection(sectionId);
    } else {
      setIsMobileMenuOpen(false);
      // Navigate to homepage with hash so the section is in the DOM
      window.location.href = `/#${sectionId}`;
    }
  };


  return (
    <header className="py-4 border-b border-blue-700/15 lg:border-none relative z-10">
      <div className="absolute inset-0 backdrop-blur -z-10 lg:hidden"></div>
      <div className="container">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between rounded-xl lg:border border-blue-700/15 lg:p-2.5">
          <div className="absolute inset-0 backdrop-blur -z-10 hidden lg:block"></div>

          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo.png"
              alt={t("home.header.logoAlt")}
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-contain"
            />
          </Link>

          <div className="hidden lg:block">
            <nav className="flex gap-6 text-sm xl:gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="group relative px-2 py-1.5 text-black/70 hover:text-[#185df9] transition-colors duration-200 cursor-pointer"
                >
                  <span>{item.label}</span>
                  <span className="pointer-events-none absolute -bottom-[2px] left-0 h-[2px] w-full origin-left scale-x-0 rounded-full bg-[#2D6DFC] transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <div className="hidden lg:flex lg:items-center lg:gap-3">
              {dashboardHref ? (
                <Link href={dashboardHref}>
                  <Button className="transition-all duration-200 hover:translate-y-[-1px] hover:shadow-md">
                    {t("home.header.dashboard")}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button
                      variant="ghost"
                      className="transition-all duration-200 hover:bg-blue-50 hover:text-[#185df9]"
                    >
                      {t("home.header.signIn")}
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button className="transition-all duration-200 hover:translate-y-[-1px] hover:shadow-md">
                      {t("home.header.register")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-blue-700/20 bg-white/70 p-0 text-black transition-colors duration-200 hover:bg-white"
              aria-label={t("home.header.menuToggle")}
              aria-expanded={isMobileMenuOpen}
            >
              <Image
                src={MenuIcon}
                alt="menu"
                width={20}
                height={20}
                className="h-5 w-5 invert"
              />
            </button>
          </div>
        </div>

        {/* Mobile menu panel - same nav as desktop, visible only when toggled */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute left-4 right-4 top-full z-20 mt-2 rounded-xl border border-blue-700/15 bg-white/95 px-4 py-4 shadow-lg backdrop-blur">
            <nav className="flex flex-col gap-2 text-sm">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="group relative px-2 py-2 text-left text-black/70 hover:text-[#185df9] transition-colors duration-200 cursor-pointer"
                >
                  <span>{item.label}</span>
                  <span className="pointer-events-none absolute bottom-1 left-2 right-2 h-[2px] origin-left scale-x-0 rounded-full bg-[#2D6DFC] transition-transform duration-300 ease-out group-hover:scale-x-100" />
                </button>
              ))}
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-blue-700/10 pt-4">
              {dashboardHref ? (
                <Link href={dashboardHref} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full transition-all duration-200">
                    {t("home.header.dashboard")}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full transition-all duration-200 hover:bg-blue-50 hover:text-[#185df9]"
                    >
                      {t("home.header.signIn")}
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full transition-all duration-200">
                      {t("home.header.register")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
