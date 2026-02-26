"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import MenuIcon from "@/public/assets/icon-menu.svg";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

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
    if (isHomePage) {
      scrollToSection(sectionId);
    } else {
      setIsMobileMenuOpen(false);
      // Navigate to homepage with hash so the section is in the DOM
      window.location.href = `/#${sectionId}`;
    }
  };


  return (
    <header className="py-4 border-b border-blue-700/15 md:border-none sticky top-0 z-10">
      <div className="absolute inset-0 backdrop-blur -z-10 md:hidden"></div>
      <div className="container">
        <div className="flex justify-between items-center md:border border-blue-700/15 md:p-2.5 rounded-xl max-w-4xl mx-auto relative">
          <div className="absolute inset-0 backdrop-blur -z-10 hidden md:block"></div>

          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo.png"
              alt="TechConnex"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-contain"
            />
          </Link>

          <div className="hidden md:block">
            <nav className="flex gap-8 text-sm">
            <button
                onClick={() => handleNavClick("about")}
                className="text-black/70 hover:text-black transition cursor-pointer"
              >
                About
              </button>
              <button
                onClick={() => handleNavClick("features")}
                className="text-black/70 hover:text-black transition cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick("ai-intelligence")}
                className="text-black/70 hover:text-black transition cursor-pointer"
              >
                AI Intelligence
              </button>
              <button
                onClick={() => handleNavClick("milestones")}
                className="text-black/70 hover:text-black transition cursor-pointer"
              >
                Milestones
              </button>
              <button
                onClick={() => handleNavClick("showcase")}
                className="text-black/70 hover:text-black transition cursor-pointer"
              >
                Showcase
              </button>
            </nav>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/auth/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Register</Button>
            </Link>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-0 border-0 bg-transparent cursor-pointer"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Image
                src={MenuIcon}
                alt="menu"
                width={20}
                height={20}
                className="invert"
              />
            </button>
          </div>
        </div>

        {/* Mobile menu panel - same nav as desktop, visible only when toggled */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full mt-0 border-b border-blue-700/15 bg-white/95 backdrop-blur py-4 px-4 z-20">
            <nav className="flex flex-col gap-2 text-sm">
              <button
                onClick={() => handleNavClick("about")}
                className="text-left py-2 text-black/70 hover:text-black transition cursor-pointer"
              >
                About
              </button>
              <button
                onClick={() => handleNavClick("features")}
                className="text-left py-2 text-black/70 hover:text-black transition cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick("ai-intelligence")}
                className="text-left py-2 text-black/70 hover:text-black transition cursor-pointer"
              >
                AI Intelligence
              </button>
              <button
                onClick={() => handleNavClick("milestones")}
                className="text-left py-2 text-black/70 hover:text-black transition cursor-pointer"
              >
                Milestones
              </button>
              <button
                onClick={() => handleNavClick("showcase")}
                className="text-left py-2 text-black/70 hover:text-black transition cursor-pointer"
              >
                Showcase
              </button>
              <button
                onClick={() => handleNavClick("video")}
                className="text-left py-2 text-black/70 hover:text-black transition cursor-pointer"
              >
                Video
              </button>
              <button
                onClick={() => handleNavClick("talent")}
                className="text-left py-2 text-black/70 hover:text-black transition cursor-pointer"
              >
                Talent
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
