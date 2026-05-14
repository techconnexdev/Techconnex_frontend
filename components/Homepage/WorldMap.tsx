"use client";
import WorldMap from "@/components/ui/world-map";
import { useI18n } from "@/contexts/I18nProvider";
import GlobeDemo from "../globe-demo";
import Heading from "./Services/Heading";

export function WorldMapDemo() {
  const { t } = useI18n();
  return (
    <div className="relative py-16 md:py-60 bg-gradient-to-b w-full overflow-hidden">
      {/* Bottom gradient: blend into WobbleCard */}
      <div
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-blue-100/40 to-transparent pointer-events-none"
        aria-hidden
      />
      <Heading
        tag="Steps"
        title={t("home.worldMap.title")}
        text={t("home.worldMap.subtitle")}
      />
      <div className="relative max-w-5xl mx-auto">
        <GlobeDemo />
      </div>
    </div>
  );
}
