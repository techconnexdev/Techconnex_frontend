import { AdminLayout } from "@/components/admin-layout"
import PaymentsClient from "./PaymentsClient"

export default function AdminPaymentsPage() {
  return (
    <AdminLayout>
      <PaymentsClient />
    </AdminLayout>
  )
}
