"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nProvider";
import LegalContactTable from "./LegalContactTable";

export default function PrivacyPolicyContent() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const stripeUrl = t("legal.cookies.stripePrivacyUrl");

  return (
    <>
      <h1 className="text-3xl font-bold mb-2">{t("legal.privacy.h1")}</h1>
      <p className="text-gray-600 text-sm mb-6">
        {t("legal.shared.operatedByLinePrivacy", { date: "February 21, 2026" })}
      </p>

      <p className="mb-6">{t("legal.privacy.intro.p1")}</p>
      <p className="mb-6">
        {t("legal.privacy.intro.p2a")}
        <a
          href={t("legal.shared.cybernetContactUrl")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {t("legal.shared.cybernetContactUrl")}
        </a>
        {t("legal.privacy.intro.p2b")}
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold mb-3">
          {t("legal.privacy.summary.title")}
        </h2>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>{t("legal.privacy.summary.li1")}</li>
          <li>{t("legal.privacy.summary.li2")}</li>
          <li>{t("legal.privacy.summary.li3")}</li>
          <li>{t("legal.privacy.summary.li4")}</li>
          <li>{t("legal.privacy.summary.li5")}</li>
          <li>{t("legal.privacy.summary.li6")}</li>
          <li>{t("legal.privacy.summary.li7")}</li>
          <li>{t("legal.privacy.summary.li8")}</li>
        </ul>
      </div>

      <h2 id="what-we-collect" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s1.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.privacy.s1.short")}</p>
      <p className="mb-2 font-medium">{t("legal.privacy.s1.directLabel")}</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>{t("legal.privacy.s1.li1")}</li>
        <li>{t("legal.privacy.s1.li2")}</li>
        <li>{t("legal.privacy.s1.li3")}</li>
        <li>{t("legal.privacy.s1.li4")}</li>
        <li>{t("legal.privacy.s1.li5")}</li>
        <li>{t("legal.privacy.s1.li6")}</li>
        <li>{t("legal.privacy.s1.li7")}</li>
      </ul>
      <p className="mb-2 font-medium">{t("legal.privacy.s1.sensitiveLabel")}</p>
      <p className="mb-4">{t("legal.privacy.s1.sensitiveP")}</p>
      <p className="mb-2 font-medium">{t("legal.privacy.s1.paymentLabel")}</p>
      <p className="mb-6">
        {t("legal.privacy.s1.paymentP1")}
        <a
          href={stripeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {t("legal.privacy.stripePrivacyLabel")}
        </a>
        {t("legal.privacy.s1.paymentP2")}
      </p>

      <h2
        id="automatically-collected"
        className="text-xl font-semibold mt-8 mb-3"
      >
        {t("legal.privacy.auto.h")}
      </h2>
      <ul className="list-disc pl-6 mb-6 space-y-1">
        <li>{t("legal.privacy.auto.li1")}</li>
        <li>{t("legal.privacy.auto.li2")}</li>
        <li>{t("legal.privacy.auto.li3")}</li>
      </ul>
      <p className="mb-8">{t("legal.privacy.auto.p")}</p>

      <h2 id="how-we-process" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s2.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.privacy.s2.short")}</p>
      <ul className="list-disc pl-6 mb-6 space-y-1">
        <li>{t("legal.privacy.s2.li1")}</li>
        <li>{t("legal.privacy.s2.li2")}</li>
        <li>{t("legal.privacy.s2.li3")}</li>
        <li>{t("legal.privacy.s2.li4")}</li>
        <li>{t("legal.privacy.s2.li5")}</li>
        <li>{t("legal.privacy.s2.li6")}</li>
        <li>{t("legal.privacy.s2.li7")}</li>
        <li>{t("legal.privacy.s2.li8")}</li>
        <li>{t("legal.privacy.s2.li9")}</li>
        <li>{t("legal.privacy.s2.li10")}</li>
      </ul>

      <h2 id="legal-bases" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s3.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.privacy.s3.short")}</p>
      <p className="mb-2 font-medium">{t("legal.privacy.s3.my")}</p>
      <p className="mb-4">{t("legal.privacy.s3.myP")}</p>
      <p className="mb-2 font-medium">{t("legal.privacy.s3.eu")}</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>{t("legal.privacy.s3.eu.li1")}</li>
        <li>{t("legal.privacy.s3.eu.li2")}</li>
        <li>{t("legal.privacy.s3.eu.li3")}</li>
        <li>{t("legal.privacy.s3.eu.li4")}</li>
      </ul>
      <p className="mb-2 font-medium">{t("legal.privacy.s3.ca")}</p>
      <p className="mb-6">{t("legal.privacy.s3.caP")}</p>

      <h2 id="sharing" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s4.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.privacy.s4.short")}</p>
      <p className="mb-2 font-medium">{t("legal.privacy.s4.pay")}</p>
      <p className="mb-4">{t("legal.privacy.s4.payP")}</p>
      <p className="mb-2 font-medium">{t("legal.privacy.s4.ai")}</p>
      <p className="mb-4">{t("legal.privacy.s4.aiP")}</p>
      <p className="mb-2 font-medium">{t("legal.privacy.s4.users")}</p>
      <p className="mb-4">{t("legal.privacy.s4.usersP")}</p>
      <p className="mb-2 font-medium">{t("legal.privacy.s4.legal")}</p>
      <p className="mb-4">{t("legal.privacy.s4.legalP")}</p>
      <p className="mb-2 font-medium">{t("legal.privacy.s4.biz")}</p>
      <p className="mb-6">{t("legal.privacy.s4.bizP")}</p>

      <h2 id="cookies-tracking" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s5.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.privacy.s5.short")}</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>{t("legal.privacy.s5.li1")}</li>
        <li>{t("legal.privacy.s5.li2")}</li>
        <li>{t("legal.privacy.s5.li3")}</li>
      </ul>
      <p className="mb-6">
        {t("legal.privacy.s5.p1")}
        <Link href="/cookies" className="text-blue-600 hover:underline">
          {t("home.footer.cookies")}
        </Link>
        {t("legal.privacy.s5.p2")}
      </p>

      <h2 id="ai-features" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s6.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.privacy.s6.short")}</p>
      <p className="mb-4">{t("legal.privacy.s6.p")}</p>

      <h2 id="data-transfers" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s7.h")}
      </h2>
      <p className="mb-4">{t("legal.privacy.s7.p")}</p>

      <h2 id="retention" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s8.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.privacy.s8.short")}</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>{t("legal.privacy.s8.li1")}</li>
        <li>{t("legal.privacy.s8.li2")}</li>
        <li>{t("legal.privacy.s8.li3")}</li>
        <li>{t("legal.privacy.s8.li4")}</li>
        <li>{t("legal.privacy.s8.li5")}</li>
      </ul>
      <p className="mb-6">{t("legal.privacy.s8.p")}</p>

      <h2 id="security" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s9.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.privacy.s9.short")}</p>
      <ul className="list-disc pl-6 mb-6 space-y-1">
        <li>{t("legal.privacy.s9.li1")}</li>
        <li>{t("legal.privacy.s9.li2")}</li>
        <li>{t("legal.privacy.s9.li3")}</li>
        <li>{t("legal.privacy.s9.li4")}</li>
        <li>{t("legal.privacy.s9.li5")}</li>
      </ul>
      <p className="mb-6">{t("legal.privacy.s9.p")}</p>

      <h2 id="minors" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s10.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-6">{t("legal.privacy.s10.p")}</p>

      <h2 id="privacy-rights" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s11.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.privacy.s11.short")}</p>
      <p className="mb-4">{t("legal.privacy.s11.p")}</p>
      <ul className="list-disc pl-6 mb-6 space-y-1">
        <li>{t("legal.privacy.s11.li1")}</li>
        <li>{t("legal.privacy.s11.li2")}</li>
        <li>{t("legal.privacy.s11.li3")}</li>
        <li>{t("legal.privacy.s11.li4")}</li>
        <li>{t("legal.privacy.s11.li5")}</li>
        <li>{t("legal.privacy.s11.li6")}</li>
        <li>{t("legal.privacy.s11.li7")}</li>
      </ul>
      <p className="mb-6">{t("legal.privacy.s11.footer")}</p>

      <h2 id="pdpa" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s12.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.privacy.s12.short")}</p>
      <p className="mb-4">{t("legal.privacy.s12.p")}</p>

      <h2 id="dnt" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s13.h")}
      </h2>
      <p className="mb-6">{t("legal.privacy.s13.p")}</p>

      <h2 id="updates" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s14.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-6">{t("legal.privacy.s14.p")}</p>

      <h2 id="contact" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s15.h")}
      </h2>
      <p className="mb-4">{t("legal.privacy.s15.p")}</p>
      <LegalContactTable />

      <h2 id="reviewing-data" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.privacy.s16.h")}
      </h2>
      <p className="mb-4">{t("legal.privacy.s16.p")}</p>
      <p className="text-sm text-gray-600 mt-8">
        {t("legal.shared.copyright", { year })}
      </p>
    </>
  );
}
