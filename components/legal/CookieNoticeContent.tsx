"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nProvider";
import LegalContactTable from "./LegalContactTable";

export default function CookieNoticeContent() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <>
      <h1 className="text-3xl font-bold mb-2">{t("legal.cookies.h1")}</h1>
      <p className="text-gray-600 text-sm mb-6">
        {t("legal.shared.operatedByLine", { date: "February 2026" })}
      </p>

      <p className="mb-6">
        {t("legal.cookies.intro.p1a")}
        <Link href="/privacy" className="text-blue-600 hover:underline">
          {t("home.footer.privacy")}
        </Link>
        {t("legal.cookies.intro.p1b")}
        <Link href="/terms" className="text-blue-600 hover:underline">
          {t("home.footer.terms")}
        </Link>
        {t("legal.cookies.intro.p1c")}
      </p>
      <p className="mb-6">{t("legal.cookies.intro.p2")}</p>

      <h2 id="what-are-cookies" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.cookies.s1.h")}
      </h2>
      <p className="mb-4">{t("legal.cookies.s1.p1")}</p>
      <p className="mb-4">{t("legal.cookies.s1.p2")}</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>
          <strong>{t("legal.cookies.s1.li1.label")}</strong>
          {t("legal.cookies.s1.li1.text")}
        </li>
        <li>
          <strong>{t("legal.cookies.s1.li2.label")}</strong>
          {t("legal.cookies.s1.li2.text")}
        </li>
      </ul>
      <p className="mb-6">{t("legal.cookies.s1.p3")}</p>

      <h2 id="what-cookies-we-use" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.cookies.s2.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.cookies.s2.p1")}</p>
      <p className="mb-4">{t("legal.cookies.s2.p2")}</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>
          <strong>{t("legal.cookies.s2.li1.label")}</strong>
          {t("legal.cookies.s2.li1.text")}
        </li>
        <li>
          <strong>{t("legal.cookies.s2.li2.label")}</strong>
          {t("legal.cookies.s2.li2.text")}
        </li>
        <li>
          <strong>{t("legal.cookies.s2.li3.label")}</strong>
          {t("legal.cookies.s2.li3.text")}
        </li>
      </ul>
      <div className="overflow-x-auto my-6">
        <table className="w-full border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 p-2 text-left">
                {t("legal.cookies.table.th.purpose")}
              </th>
              <th className="border border-gray-200 p-2 text-left">
                {t("legal.cookies.table.th.type")}
              </th>
              <th className="border border-gray-200 p-2 text-left">
                {t("legal.cookies.table.th.stored")}
              </th>
              <th className="border border-gray-200 p-2 text-left">
                {t("legal.cookies.table.th.duration")}
              </th>
              <th className="border border-gray-200 p-2 text-left">
                {t("legal.cookies.table.th.why")}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r1.c1")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r1.c2")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r1.c3")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r1.c4")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r1.c5")}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r2.c1")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.shared.typeCookie")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r2.c3")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r2.c4")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r2.c5")}
              </td>
            </tr>
            <tr>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r3.c1")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r3.c2")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r3.c3")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r3.c4")}
              </td>
              <td className="border border-gray-200 p-2">
                {t("legal.cookies.table.r3.c5")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mb-6">{t("legal.cookies.s2.p3")}</p>

      <h2 id="cookie-details" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.cookies.s3.h")}
      </h2>
      <h3 className="text-lg font-medium mt-4 mb-2">
        {t("legal.cookies.s3.h31")}
      </h3>
      <p className="mb-4">{t("legal.cookies.s3.p31")}</p>
      <h3 className="text-lg font-medium mt-4 mb-2">
        {t("legal.cookies.s3.h32")}
      </h3>
      <p className="mb-4">{t("legal.cookies.s3.p32")}</p>
      <h3 className="text-lg font-medium mt-4 mb-2">
        {t("legal.cookies.s3.h33")}
      </h3>
      <p className="mb-6">{t("legal.cookies.s3.p33")}</p>

      <h2 id="what-we-do-not-use" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.cookies.s4.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.cookies.s4.p1")}</p>
      <p className="mb-4">{t("legal.cookies.s4.p2")}</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>{t("legal.cookies.s4.li1")}</li>
        <li>{t("legal.cookies.s4.li2")}</li>
        <li>{t("legal.cookies.s4.li3")}</li>
        <li>{t("legal.cookies.s4.li4")}</li>
      </ul>
      <p className="mb-6">{t("legal.cookies.s4.p3")}</p>

      <h2 id="how-long" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.cookies.s5.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.cookies.s5.p1")}</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>
          <strong>{t("legal.cookies.s5.li1.label")}</strong>
          {t("legal.cookies.s5.li1.text")}
        </li>
        <li>
          <strong>{t("legal.cookies.s5.li2.label")}</strong>
          {t("legal.cookies.s5.li2.text")}
        </li>
      </ul>
      <p className="mb-6">{t("legal.cookies.s5.p2")}</p>

      <h2 id="managing-cookies" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.cookies.s6.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.cookies.s6.p1")}</p>
      <p className="mb-2 font-medium">{t("legal.cookies.s6.hBrowser")}</p>
      <p className="mb-4">{t("legal.cookies.s6.pBrowser")}</p>
      <p className="mb-2 font-medium">{t("legal.cookies.s6.hLocal")}</p>
      <p className="mb-4">{t("legal.cookies.s6.pLocal")}</p>
      <p className="mb-2 font-medium">{t("legal.cookies.s6.hOptOut")}</p>
      <p className="mb-6">{t("legal.cookies.s6.pOptOut")}</p>

      <h2 id="third-party" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.cookies.s7.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.cookies.s7.p1")}</p>
      <p className="mb-4">
        {t("legal.cookies.s7.p2a")}
        <a
          href={t("legal.cookies.stripePrivacyUrl")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {t("legal.cookies.stripePrivacyUrl")}
        </a>
        {t("legal.cookies.s7.p2b")}
      </p>

      <h2 id="your-rights" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.cookies.s8.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.cookies.s8.p1")}</p>
      <p className="mb-4">{t("legal.cookies.s8.p2")}</p>
      <p className="mb-6">{t("legal.cookies.s8.p3a")}</p>

      <h2 id="updates" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.cookies.s9.h")}
      </h2>
      <p className="mb-2 font-medium">{t("legal.shared.inShort")}</p>
      <p className="mb-4">{t("legal.cookies.s9.p1")}</p>
      <p className="mb-6">{t("legal.cookies.s9.p2")}</p>

      <h2 id="contact" className="text-xl font-semibold mt-8 mb-3">
        {t("legal.cookies.s10.h")}
      </h2>
      <p className="mb-4">{t("legal.cookies.s10.p1")}</p>
      <LegalContactTable />
      <p className="text-sm text-gray-600 mt-8">
        {t("legal.shared.copyright", { year })}
      </p>
    </>
  );
}
