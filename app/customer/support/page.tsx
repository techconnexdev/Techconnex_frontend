"use client";

import { SupportChatClient } from "@/components/support/SupportChatClient";
import { useI18n } from "@/contexts/I18nProvider";

export default function CustomerSupportPage() {
  const { t } = useI18n();
  return (
    
      <div className="container max-w-3xl py-6">
        <h1 className="sr-only">{t("customer.support.pageHeading")}</h1>
        <SupportChatClient />
      </div>
    
  );
}
