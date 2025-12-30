import Header from "@/components/Homepage/Header";
import Hero from "@/components/Homepage/Hero";
import { ReactLenis } from "lenis/react";
import Brand from "@/components/Homepage/Brand";
import { Features } from "@/components/Homepage/Features";
import Services from "@/components/Homepage/Services/Services";
import Milestone from "@/components/Homepage/Milestone";
import Footer from "@/components/Homepage/Footer";
import { WorldMapDemo } from "@/components/Homepage/WorldMap";
import { WobbleCardDemo } from "@/components/Homepage/WobbleCard";

export default function LandingPage() {
  return (
    <ReactLenis root>
      <div className="relative isolate">
        <Header></Header>
        <main>
          <Hero />
          <Brand />
          <Features />
          <Services />
          <WorldMapDemo />
          <Milestone />
          <WobbleCardDemo/>
          <Footer />
        </main>
      </div>
    </ReactLenis>
  );
}
