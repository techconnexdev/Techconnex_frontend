import { AdminLayout } from "@/components/admin-layout";
import PaymentDetailClient from "./PaymentDetailClient";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Payment data is fetched on the client side in PaymentDetailClient
  // We just pass the id here

  return (
    <AdminLayout>
      <PaymentDetailClient paymentId={id} />
    </AdminLayout>
  );
}

