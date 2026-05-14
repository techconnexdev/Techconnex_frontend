"use client";

import loading from "@/public/assets/favicon.svg";
import { useI18n } from "@/contexts/I18nProvider";

interface GeneratingProps {
  className?: string;
}

const Generating = ({ className }: GeneratingProps) => {
  const { t } = useI18n();
  return (
    <div
      className={`flex items-center h-[3.5rem] px-6 bg-secondary/80 backdrop-blur-3xl rounded-[1.7rem] border border-border ${
        className || ""
      } text-base`}
    >
      <img className="w-5 h-5 me-4" src={loading.src} alt="" />
      {t("home.generating.text")}
    </div>
  );
};

export default Generating;
