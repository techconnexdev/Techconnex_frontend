"use client";

import { useI18n } from "@/contexts/I18nProvider";

export default function LegalContactTable() {
  const { t } = useI18n();
  const url = t("legal.shared.cybernetContactUrl");
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full border border-gray-200 text-sm max-w-md">
        <tbody>
          <tr>
            <td className="border border-gray-200 p-2 font-medium">
              {t("legal.shared.label.company")}
            </td>
            <td className="border border-gray-200 p-2">
              {t("legal.shared.companyLegal")}
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
              {t("legal.shared.label.address")}
            </td>
            <td className="border border-gray-200 p-2">
              {t("legal.shared.addressBlock")}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-200 p-2 font-medium">
              {t("legal.shared.label.email")}
            </td>
            <td className="border border-gray-200 p-2">
              {t("legal.shared.emailContact")}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-200 p-2 font-medium">
              {t("legal.shared.label.website")}
            </td>
            <td className="border border-gray-200 p-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {url}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
