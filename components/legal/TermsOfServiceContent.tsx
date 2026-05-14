"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nProvider";
import LegalContactTable from "./LegalContactTable";

export default function TermsOfServiceContent() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const cyberUrl = t("legal.shared.cybernetContactUrl");

  return (
    <>
      <h1 className="text-3xl font-bold mb-2">{t("legal.terms.h1")}</h1>
      <p className="text-gray-600 text-sm mb-6">
        {t("legal.shared.operatedByLineTerms", {
          date: "February 2026",
          effective: "February 21, 2026",
        })}
      </p>

      <p className="mb-6">
        {t("legal.terms.intro.p1a")}
        <Link href="/privacy" className="text-blue-600 hover:underline">
          {t("home.footer.privacy")}
        </Link>
        {t("legal.terms.intro.p1b")}
      </p>

      <h2 id="company-information" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s1.h")}
      </h2>
      <div className="overflow-x-auto my-4">
        <table className="w-full border border-gray-200 text-sm max-w-md">
          <tbody>
            <tr>
              <td className="border border-gray-200 p-2 font-medium">
                {t("legal.shared.label.legalEntity")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.shared.companyNameShort")}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2 font-medium">
                {t("legal.shared.label.registrationNo")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.shared.registrationDetail")}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2 font-medium">
                {t("legal.shared.label.countryRegistration")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.shared.countryMalaysia")}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2 font-medium">
                {t("legal.shared.label.businessAddress")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.shared.addressBlock")}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2 font-medium">
                {t("legal.shared.label.platform")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.shared.platformName")}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2 font-medium">
                {t("legal.shared.label.website")}
              </td>
              <td className="border border-gray-200 p-2">
                <a
                  href={cyberUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {cyberUrl}
                </a>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2 font-medium">
                {t("legal.shared.label.contactEmail")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.shared.emailContact")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="platform-overview" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s2.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.terms.s2.short")}</p>
      <p className="mb-4">{t("legal.terms.s2.p")}</p>

      <h2 id="eligibility" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s3.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.terms.s3.short")}</p>
      <p className="mb-4">{t("legal.terms.s3.p")}</p>

      <h2 id="account-registration" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s4.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.terms.s4.short")}</p>
      <p className="mb-2 font-medium">{t("legal.terms.s4.your")}</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>{t("legal.terms.s4.li1")}</li>
        <li>{t("legal.terms.s4.li2")}</li>
        <li>{t("legal.terms.s4.li3")}</li>
        <li>{t("legal.terms.s4.li4")}</li>
      </ul>
      <p className="mb-2 font-medium">{t("legal.terms.s4.our")}</p>
      <p className="mb-4">{t("legal.terms.s4.ourP")}</p>

      <h2 id="user-roles" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s5.h")}
      </h2>
      <h3 className="text-lg font-medium mt-4 mb-2">{t("legal.terms.s5.h1")}</h3>
      <p className="mb-4">{t("legal.terms.s5.p1")}</p>
      <h3 className="text-lg font-medium mt-4 mb-2">{t("legal.terms.s5.h2")}</h3>
      <p className="mb-4">{t("legal.terms.s5.p2")}</p>
      <h3 className="text-lg font-medium mt-4 mb-2">{t("legal.terms.s5.h3")}</h3>
      <ul className="list-disc pl-6 mb-6 space-y-1">
        <li>{t("legal.terms.s5.li1")}</li>
        <li>{t("legal.terms.s5.li2")}</li>
        <li>{t("legal.terms.s5.li3")}</li>
        <li>{t("legal.terms.s5.li4")}</li>
      </ul>

      <h2 id="projects-contracts" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s6.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-6">{t("legal.terms.s6.p")}</p>

      <h2 id="payments" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s7.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.terms.s7.short")}</p>
      <p className="mb-2 font-medium">{t("legal.terms.s7.pay")}</p>
      <p className="mb-4">{t("legal.terms.s7.payP")}</p>
      <p className="mb-2 font-medium">{t("legal.terms.s7.escrow")}</p>
      <p className="mb-4">{t("legal.terms.s7.escrowP")}</p>
      <p className="mb-2 font-medium">{t("legal.terms.s7.fees")}</p>
      <p className="mb-4">{t("legal.terms.s7.feesP")}</p>
      <p className="mb-2 font-medium">{t("legal.terms.s7.payout")}</p>
      <p className="mb-4">{t("legal.terms.s7.payoutP")}</p>
      <p className="mb-2 font-medium">{t("legal.terms.s7.lim")}</p>
      <p className="mb-6">{t("legal.terms.s7.limP")}</p>

      <h2 id="milestones" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s8.h")}
      </h2>
      <p className="mb-6">{t("legal.terms.s8.p")}</p>

      <h2 id="refunds" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s9.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-6">{t("legal.terms.s9.p")}</p>

      <h2 id="ai-features" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s10.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.terms.s10.short")}</p>
      <p className="mb-4">{t("legal.terms.s10.p")}</p>

      <h2 id="communications" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s11.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.terms.s11.short")}</p>
      <p className="mb-4">{t("legal.terms.s11.p")}</p>

      <h2 id="ip" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s12.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-6">{t("legal.terms.s12.p")}</p>

      <h2 id="disputes" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s13.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.terms.s13.short")}</p>
      <p className="mb-4">{t("legal.terms.s13.p")}</p>

      <h2 id="prohibited" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s14.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.terms.s14.short")}</p>
      <p className="mb-6">{t("legal.terms.s14.p")}</p>

      <h2 id="termination" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s15.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.terms.s15.short")}</p>
      <p className="mb-4">{t("legal.terms.s15.p")}</p>

      <h2 id="liability" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s16.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-6">{t("legal.terms.s16.p")}</p>

      <h2 id="indemnification" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s17.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-6">{t("legal.terms.s17.p")}</p>

      <h2 id="force-majeure" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s18.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-6">{t("legal.terms.s18.p")}</p>

      <h2 id="privacy-data" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s19.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-6">
        {t("legal.terms.s19.short")}{" "}
        {t("legal.terms.s19.p1")}
        <Link href="/privacy" className="text-blue-600 hover:underline">
          {t("home.footer.privacy")}
        </Link>
        {t("legal.terms.s19.p2")}
      </p>

      <h2 id="changes" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s20.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-6">{t("legal.terms.s20.p")}</p>

      <h2 id="governing-law" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s21.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-6">{t("legal.terms.s21.p")}</p>

      <h2 id="contact" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.terms.s22.h")}
      </h2>
      <p className="mb-4">{t("legal.terms.s22.p")}</p>
      <LegalContactTable />
      <p className="text-sm text-gray-600 mt-8">
        {t("legal.shared.copyright", { year })}
      </p>
    </>
  );
}
