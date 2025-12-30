"use client";
import React from "react";
import { Button } from "../ui/button";
import MenuIcon from "@/public/assets/icon-menu.svg";
import { Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
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
  };
  return (
    <header className="py-4 border-b border-blue-700/15 md:border-none sticky top-0 z-10">
      <div className="absolute inset-0 backdrop-blur -z-10 md:hidden"></div>
      <div className="container">
        <div className="flex justify-between items-center md:border border-blue-700/15 md:p-2.5 rounded-xl max-w-2xl mx-auto relative">
          <div className="absolute inset-0 backdrop-blur -z-10 hidden md:block"></div>

          <div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="hidden md:block">
            <nav className="flex gap-8 text-sm">
              <button
                onClick={() => scrollToSection("features")}
                className="text-black/70 hover:text-black transition cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("ai-intelligence")}
                className="text-black/70 hover:text-black transition cursor-pointer"
              >
                AI Intelligence
              </button>
              <button
                onClick={() => scrollToSection("milestones")}
                className="text-black/70 hover:text-black transition cursor-pointer"
              >
                Milestones
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className="text-black/70 hover:text-black transition cursor-pointer"
              >
                About
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
            <Image
              src={MenuIcon}
              alt="menu"
              width={20}
              height={20}
              className="invert md:hidden"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
