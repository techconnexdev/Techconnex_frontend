"use client";

import { ProviderLayout } from "@/components/provider-layout";
import { SupportChatClient } from "@/components/support/SupportChatClient";

export default function ProviderSupportPage() {
  return (
    <ProviderLayout>
      <div className="container max-w-3xl py-6">
        <SupportChatClient />
      </div>
    </ProviderLayout>
  );
}
