"use client";

import { CustomerLayout } from "@/components/customer-layout";
import { SupportChatClient } from "@/components/support/SupportChatClient";

export default function CustomerSupportPage() {
  return (
    <CustomerLayout>
      <div className="container max-w-3xl py-6">
        <SupportChatClient />
      </div>
    </CustomerLayout>
  );
}
